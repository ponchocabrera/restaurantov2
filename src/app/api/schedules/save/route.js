import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { callEmployeeForCoverage, sendSMSToEmployeeForCoverage } from '@/lib/twilio';
import { revalidatePath } from 'next/cache';

export async function PUT(request) {
  let client;
  try {
    console.log("DEBUG: Starting schedule save PUT request.");

    // Verify user session.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("ERROR: Unauthorized user.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read the raw body once and parse it.
    const rawBody = await request.text();
    console.log("DEBUG: Raw request body:", rawBody);
    const { shifts, startDate, endDate } = JSON.parse(rawBody);

    console.log("DEBUG: Parsed startDate:", startDate);
    console.log("DEBUG: Parsed endDate:", endDate);
    console.log(`DEBUG: Received ${shifts.length} shifts from the client`);

    // Build newShifts from a flat shifts array.
    const newShifts = [];
    const seenShifts = new Set();

    // Helper function to normalize dates.
    const normalizeDate = (date) =>
      new Date(date).toISOString().split("T")[0];

    // Iterate over shifts.
    for (const shift of shifts) {
      const employee_id = shift.employee_id;
      const zone_id = shift.zone_id;
      const normalizedDate = normalizeDate(shift.shift_date);
      const key = `${employee_id}-${zone_id}-${normalizedDate}-${shift.start_time}`;

      console.log(`Processing shift: ${JSON.stringify(shift)}`);
      if (seenShifts.has(key)) {
        console.log(`Skipping duplicate shift: ${key}`);
        continue;
      }
      seenShifts.add(key);

      // Decide coverage status if not explicitly set
      const coverageStatus =
        shift.coverage_status ||
        (shift.isCoverage || shift.is_coverage ? 'pending' : null);

      newShifts.push({
        id: shift.id,
        tempId: shift.tempId,
        employee_id,
        zone_id,
        zone_name: shift.zone_name || 'Unknown Zone',
        role: shift.role,
        shift_date: shift.shift_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        status: shift.status || 'scheduled',
        is_coverage: shift.isCoverage || shift.is_coverage || false,
        covered_for: shift.coveredFor || shift.covered_for || null,
        coverage_assigned: shift.coverageAssigned || shift.coverage_assigned || null,
        no_show_reason: shift.noShowReason || shift.no_show_reason || null,
        coverage_status: coverageStatus
      });
    }

    console.log("DEBUG: New Shifts to Insert:", newShifts);

    // Get a client from the pool.
    client = await pool.connect();
    await client.query('BEGIN');

    // Get restaurant id for the current user.
    const resRestaurant = await client.query(
      'SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1',
      [session.user.id]
    );
    if (!resRestaurant.rows[0]?.id) {
      throw new Error('Restaurant record not found for this user');
    }
    const restaurantId = resRestaurant.rows[0].id;
    console.log("DEBUG: Retrieved restaurantId:", restaurantId);

    // Delete existing schedules in the given date range.
    await client.query(
      `DELETE FROM schedules 
       WHERE shift_date BETWEEN $1 AND $2 
         AND employee_id IN (
           SELECT id FROM employees WHERE restaurant_id = $3
         )`,
      [startDate, endDate, restaurantId]
    );
    console.log("DEBUG: Existing schedules deleted.");

    // Always insert every shift (full replace approach).
    for (const shift of newShifts) {
      console.log("DEBUG: Inserting shift:", shift);
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
      const newId = res.rows[0].id;
      shift.newId = newId;
      console.log(`DEBUG: Inserted new shift with id ${newId}`);
    }

    await client.query('COMMIT');
    console.log("DEBUG: Transaction committed.");

    // Automatically trigger coverage calls or SMS for coverage shifts.
    const currentCallDelay = process.env.CALL_DELAY_MS;
    console.log("DEBUG: CALL_DELAY_MS env value:", currentCallDelay);
    const delayMs = currentCallDelay ? parseInt(currentCallDelay) : 10000;
    console.log("DEBUG: Using delayMs:", delayMs, "ms");

    // Coverage calls
    newShifts.forEach(shift => {
      if ((shift.is_coverage) && shift.coverage_status === 'pending' && shift.newId) {
        console.log(`DEBUG: Scheduling coverage call for shift id ${shift.newId} (tempId: ${shift.tempId})`);
        setTimeout(() => {
          console.log(`DEBUG: Triggering callEmployeeForCoverage for shift id ${shift.newId}`);
          callEmployeeForCoverage(shift.newId)
            .then(() => {
              console.log(`DEBUG: Coverage call successfully triggered for shift id ${shift.newId}`);
            })
            .catch(err => {
              console.error(`ERROR: Coverage call failed for shift id ${shift.newId}:`, err);
            });
        }, delayMs);
      }
    });

    // Coverage SMS
    newShifts.forEach(shift => {
      if ((shift.is_coverage) && shift.coverage_status === 'notified' && shift.newId) {
        console.log(`DEBUG: Triggering SMS notification for shift id ${shift.newId}`);
        sendSMSToEmployeeForCoverage(shift.newId)
          .then(() => {
            console.log(`DEBUG: SMS successfully triggered for shift id ${shift.newId}`);
          })
          .catch(err => {
            console.error(`ERROR: SMS triggering failed for shift id ${shift.newId}:`, err);
          });
      }
    });

    // Revalidate the schedules page to force a fresh fetch of schedule data.
    revalidatePath('/schedules');

    // Transform the flat array (newShifts) into a nested structure keyed by zone_name.
    const nestedSchedule = newShifts.reduce((acc, shift) => {
      const zone = shift.zone_name || 'Unknown Zone';
      if (!acc[zone]) {
        acc[zone] = [];
      }
      acc[zone].push(shift);
      return acc;
    }, {});

    return NextResponse.json({ message: 'Changes saved successfully', schedule: nestedSchedule });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error in schedule save route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
