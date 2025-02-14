// File: src/app/api/schedules/save/route.js

import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

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
              no_show_reason: shift.noShowReason || null
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
                employee_id, zone_id, role, shift_date, start_time, end_time, status, 
                is_coverage, covered_for, coverage_assigned, no_show_reason
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
              shift.no_show_reason
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
                id, employee_id, zone_id, role, shift_date, start_time, end_time, status, 
                is_coverage, covered_for, coverage_assigned, no_show_reason
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
              shift.no_show_reason
            ]
          );
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

    return NextResponse.json({ message: 'Changes saved successfully' });
  } catch (error) {
    console.error('Error saving schedule changes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
