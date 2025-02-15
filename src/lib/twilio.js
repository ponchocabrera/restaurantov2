import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

export async function PUT(request) {
  try {
    // Verify user session.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the incoming payload.
    const { schedule: nestedSchedule, coverageRequests, startDate, endDate } = await request.json();

    // Flatten the nested schedule into an array of shift objects.
    // Each shift object may contain a tempId (assigned by the front end) if it's a new or coverage shift.
    const newShifts = [];
    for (const zone in nestedSchedule) {
      const employees = nestedSchedule[zone];
      for (const employee of employees) {
        const employee_id = employee.employee_id; // should be numeric
        const zone_id = employee.zone_id;         // should be numeric
        for (const day in employee.days) {
          for (const shift of employee.days[day]) {

            // If you want a default coverage_status for coverage shifts:
            // e.g., 'pending' if is_coverage is true
            const coverageStatus = shift.coverage_status
              ? shift.coverage_status
              : shift.isCoverage
                ? 'pending'
                : null;

            newShifts.push({
              id: shift.id, // may be a number or a string (for new/coverage shifts)
              tempId: shift.tempId, // temporary key from the front end (if any)
              isCoverage: shift.isCoverage === true,
              employee_id,
              zone_id,
              role: shift.role,
              shift_date: shift.shift_date,
              start_time: shift.start_time,
              end_time: shift.end_time,
              status: shift.status || 'scheduled',
              is_coverage: shift.isCoverage || false,
              covered_for: shift.coveredFor || null,
              coverage_assigned: shift.coverageAssigned || null,
              no_show_reason: shift.noShowReason || null,
              coverage_status: coverageStatus // NEW field
            });
          }
        }
      }
    }

    console.log("New Shifts to Insert:", newShifts);
    console.log("Coverage Requests to Insert:", coverageRequests);

    // Process each coverage request.
    // We assume the coverageRequests array now includes a tempId property.
    if (coverageRequests && Array.isArray(coverageRequests)) {
      for (const reqObj of coverageRequests) {
        const result = await query(
          `INSERT INTO coverage_requests
           (temp_id, schedule_id, requested_by, reason, status, replacement_employee)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            reqObj.tempId, // temporary key from the front end
            reqObj.schedule_id, // may be null for new shifts
            reqObj.requested_by,
            reqObj.reason,
            reqObj.status,
            reqObj.replacement_employee
          ]
        );
        console.log("Inserted coverage request:", result.rows[0]);
      }
    }

    // Retrieve the restaurant ID for the current user.
    const restaurantRes = await query(
      'SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1',
      [session.user.id]
    );
    if (!restaurantRes.rows.length) {
      throw new Error('Restaurant not found');
    }
    const restaurantId = restaurantRes.rows[0].id;

    // Begin a transaction.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing schedules in the given date range for employees in this restaurant.
      await client.query(
        `DELETE FROM schedules 
         WHERE shift_date BETWEEN $1 AND $2 
           AND employee_id IN (
             SELECT id FROM employees WHERE restaurant_id = $3
           )`,
        [startDate, endDate, restaurantId]
      );

      // Insert each new shift.
      // For shifts that are new (or coverage) and have a non-numeric id, do not include the id column.
      // Use RETURNING id so we capture the new auto-generated id.
      for (const shift of newShifts) {
        if (typeof shift.id !== 'number') {
          console.log("Inserting auto-generated shift:", shift);
          const res = await client.query(
            `INSERT INTO schedules (
                employee_id, 
                zone_id, 
                role, 
                shift_date, 
                start_time, 
                end_time, 
                status, 
                is_coverage, 
                covered_for, 
                coverage_assigned, 
                no_show_reason,
                coverage_status
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING id`,
            [
              shift.employee_id,
              shift.zone_id,
              shift.role,
              shift.shift_date,
              shift.start_time,
              shift.end_time,
              shift.status,
              shift.is_coverage,
              shift.covered_for,
              shift.coverage_assigned,
              shift.no_show_reason,
              shift.coverage_status
            ]
          );
          // Capture the new id.
          const newId = res.rows[0].id;
          // If this shift had a temporary key, update its record (for later updating coverage requests).
          shift.newId = newId;
        } else {
          console.log("Inserting shift with provided id:", shift);
          await client.query(
            `INSERT INTO schedules (
                id, 
                employee_id, 
                zone_id, 
                role, 
                shift_date, 
                start_time, 
                end_time, 
                status, 
                is_coverage, 
                covered_for, 
                coverage_assigned, 
                no_show_reason,
                coverage_status
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              shift.id,
              shift.employee_id,
              shift.zone_id,
              shift.role,
              shift.shift_date,
              shift.start_time,
              shift.end_time,
              shift.status,
              shift.is_coverage,
              shift.covered_for,
              shift.coverage_assigned,
              shift.no_show_reason,
              shift.coverage_status
            ]
          );
          // Assign the provided id as the newId so that later the coverage_requests update
          // and SMS trigger find a numeric, persisted schedule id.
          shift.newId = shift.id;
        }
      }

      await client.query('COMMIT');

      // After inserting schedules, update any coverage_requests that have a temp_id.
      // Loop through newShifts that have a tempId and a newId.
      for (const shift of newShifts) {
        if (shift.tempId && shift.newId) {
          await client.query(
            `UPDATE coverage_requests
             SET schedule_id = $1
             WHERE temp_id = $2`,
            [shift.newId, shift.tempId]
          );
          console.log(`Updated coverage_requests for tempId ${shift.tempId} with schedule_id ${shift.newId}`);
        }
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving schedule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
      client.release();
    }

    // Automatically trigger outbound coverage calls for new coverage shifts.
    // Use a delay defined in the environment variable, defaulting to 5 minutes (300000 ms).
    const delayMs = process.env.CALL_DELAY_MS ? parseInt(process.env.CALL_DELAY_MS) : 10000;
    newShifts.forEach(shift => {
      if (shift.isCoverage && shift.coverage_status === 'pending' && shift.newId) {
        console.log(`Scheduling coverage call for shift id ${shift.newId} (tempId: ${shift.tempId}) in ${delayMs} ms`);
        setTimeout(() => {
          callEmployeeForCoverage(shift.newId)
            .then(() => {
              console.log(`Coverage call successfully triggered for shift id ${shift.newId}`);
            })
            .catch(err => {
              console.error(`Error triggering coverage call for shift id ${shift.newId}:`, err);
            });
        }, delayMs);
      }
    });

    // Add SMS triggering
    newShifts.forEach(shift => {
      if (shift.isCoverage && shift.coverage_status === 'notified' && shift.newId) {
        console.log(`Triggering SMS for shift id ${shift.newId}`);
        console.log("Using TWILIO_WHATSAPP_FROM:", process.env.TWILIO_WHATSAPP_FROM);
        console.log("DEBUG: Sending WhatsApp message to:", `whatsapp:${phone}`);
        sendSMSToEmployeeForCoverage(shift.newId)
          .then(() => {
            console.log(`SMS successfully triggered for shift ${shift.newId}`);
          })
          .catch(console.error);
      }
    });

    return NextResponse.json({ message: 'Changes saved successfully' });
  } catch (error) {
    console.error('Error in schedule save route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function callEmployeeForCoverage(coverageId) {
  console.log("DEBUG: Starting callEmployeeForCoverage for coverageId:", coverageId);
  try {
    const client = await pool.connect();
    try {
      const queryText = `
        SELECT s.employee_id, e.phone
        FROM schedules s
        JOIN employees e ON s.employee_id = e.id
        WHERE s.id = $1
      `;
      console.log("DEBUG: Executing query for coverage record, id:", coverageId);
      const result = await client.query(queryText, [coverageId]);
      if (result.rowCount === 0) {
        console.error(`No coverage record found for id: ${coverageId}`);
        return;
      }
      const { phone } = result.rows[0];
      if (!phone) {
        console.error("No phone number found for coverage id:", coverageId);
        return;
      }
      const callUrl = `${process.env.TWILIO_BASE_URL}/twilio/coverage-ivr?coverageId=${coverageId}`;
      console.log(`DEBUG: Initiating call to ${phone} from ${process.env.TWILIO_CALLER_ID} using URL: ${callUrl}`);
      const call = await twilioClient.calls.create({
        to: phone,
        from: process.env.TWILIO_CALLER_ID,
        url: callUrl
      });
      console.log("Twilio call initiated. Call SID:", call.sid);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error in callEmployeeForCoverage:", err);
  }
}

export async function sendSMSToEmployeeForCoverage(coverageId) {
  const client = await pool.connect();
  try {
    // Determine if the coverageId is numeric (schedule_id) or a temporary ID.
    const isNumericId = !isNaN(coverageId);

    // Retrieve coverage request details for the given coverageId.
    const coverageReq = await client.query(
      `SELECT cr.schedule_id, s.employee_id, e.phone, s.shift_date, s.start_time, s.end_time
       FROM coverage_requests cr
       JOIN schedules s ON cr.schedule_id = s.id
       JOIN employees e ON s.employee_id = e.id
       WHERE ${isNumericId ? 'cr.schedule_id' : 'cr.temp_id'} = $1`,
      [coverageId]
    );

    if (coverageReq.rowCount === 0) {
      throw new Error(`No coverage request found for ${isNumericId ? 'schedule' : 'temp'} ID: ${coverageId}`);
    }

    const { phone, shift_date, start_time, end_time } = coverageReq.rows[0];

    // Dynamically build the response URL with coverageId as a query parameter.
    const responseUrl = `${process.env.TWILIO_BASE_URL}/api/sms/coverage-response?coverageId=${coverageId}`;

    const message = `You're requested to cover a shift on ${shift_date} from ${start_time} to ${end_time}. Reply YES to accept or NO to decline: ${responseUrl}`;

    // Debug logs.
    console.log("DEBUG: TWILIO_WHATSAPP_FROM:", process.env.TWILIO_WHATSAPP_FROM);
    console.log("DEBUG: Recipient phone number (from DB):", phone);
    console.log("DEBUG: Full recipient value:", `whatsapp:${phone}`);
    console.log("DEBUG: Message body:", message);

    // Send the WhatsApp SMS using the dynamically built URL.
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      body: message,
      to: `whatsapp:${phone}`
    });

  } finally {
    client.release();
  }
}