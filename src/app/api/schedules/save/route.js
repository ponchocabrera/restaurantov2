// File: src/app/api/schedules/save/route.js

import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { callEmployeeForCoverage } from '@/lib/twilio';
import { revalidatePath } from 'next/cache';

export async function PUT(request) {
  try {
    console.log("DEBUG: Starting schedule save PUT request.");
    // Verify user session.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("ERROR: Unauthorized user.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Parse the incoming payload.
    const { schedule: nestedSchedule, coverageRequests, startDate, endDate } = await request.json();
    console.log("DEBUG: Received schedule data. StartDate:", startDate, "EndDate:", endDate);
    
    // Flatten the nested schedule into an array of shift objects.
    const newShifts = [];
    for (const zone in nestedSchedule) {
      const employees = nestedSchedule[zone];
      for (const employee of employees) {
        const employee_id = employee.employee_id;
        const zone_id = employee.zone_id;
        for (const day in employee.days) {
          for (const shift of employee.days[day]) {
            const coverageStatus = shift.coverage_status
              ? shift.coverage_status
              : shift.isCoverage
                ? 'pending'
                : null;
            newShifts.push({
              id: shift.id,
              tempId: shift.tempId,
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
              coverage_status: coverageStatus
            });
          }
        }
      }
    }
    console.log("DEBUG: New Shifts to Insert:", newShifts);
    console.log("DEBUG: Coverage Requests to Insert:", coverageRequests);

    // Process each coverage request.
    if (coverageRequests && Array.isArray(coverageRequests)) {
      for (const reqObj of coverageRequests) {
        const result = await query(
          `INSERT INTO coverage_requests
           (temp_id, schedule_id, requested_by, reason, status, replacement_employee)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [reqObj.tempId, reqObj.schedule_id, reqObj.requested_by, reqObj.reason, reqObj.status, reqObj.replacement_employee]
        );
        console.log("DEBUG: Inserted coverage request:", result.rows[0]);
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
    console.log("DEBUG: Retrieved restaurantId:", restaurantId);

    // Begin a transaction.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log("DEBUG: Transaction started.");

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

      // Insert each new shift.
      for (const shift of newShifts) {
        if (typeof shift.id !== 'number') {
          console.log("DEBUG: Inserting auto-generated shift:", shift);
          const res = await client.query(
            `INSERT INTO schedules (
                employee_id, zone_id, role, shift_date, start_time,
                end_time, status, is_coverage, covered_for,
                coverage_assigned, no_show_reason, coverage_status
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING id`,
            [shift.employee_id, shift.zone_id, shift.role, shift.shift_date, shift.start_time,
             shift.end_time, shift.status, shift.is_coverage, shift.covered_for, shift.coverage_assigned,
             shift.no_show_reason, shift.coverage_status]
          );
          // Capture the new id.
          const newId = res.rows[0].id;
          // If this shift had a temporary key, update its record (for later updating coverage requests).
          shift.newId = newId;
        } else {
          console.log("Inserting shift with provided id:", shift);
          await client.query(
            `INSERT INTO schedules (
                id, employee_id, zone_id, role, shift_date, start_time,
                end_time, status, is_coverage, covered_for, coverage_assigned,
                no_show_reason, coverage_status
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [shift.id, shift.employee_id, shift.zone_id, shift.role, shift.shift_date, shift.start_time,
             shift.end_time, shift.status, shift.is_coverage, shift.covered_for, shift.coverage_assigned,
             shift.no_show_reason, shift.coverage_status]
          );
          console.log("DEBUG: Shift inserted with provided id:", shift.id);
        }
      }

      await client.query('COMMIT');
      console.log("DEBUG: Transaction committed.");

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
          console.log(`DEBUG: Updated coverage_requests for tempId ${shift.tempId} with schedule_id ${shift.newId}`);
        }
      }

      // Automatically trigger outbound coverage calls for new coverage shifts.
      const currentCallDelay = process.env.CALL_DELAY_MS;
      console.log("DEBUG: CALL_DELAY_MS env value:", currentCallDelay);

      const delayMs = currentCallDelay ? parseInt(currentCallDelay) : 10000;
      console.log("DEBUG: Using delayMs:", delayMs, "ms");
      newShifts.forEach(shift => {
        if (shift.isCoverage && shift.coverage_status === 'pending' && shift.newId) {
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

      // Revalidate the schedules page to force a fresh fetch of schedule data.
      revalidatePath('/schedules');

      return NextResponse.json({ message: 'Changes saved successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("ERROR: Transaction error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("ERROR: In schedule save route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
