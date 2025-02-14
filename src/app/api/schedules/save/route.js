// File: src/app/api/schedules/save/route.js

import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config'; // Adjusted import path

export async function PUT(request) {
  try {
    // Verify user session.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Expect the client to send the nested schedule along with the date range.
    const { schedule: nestedSchedule, startDate, endDate } = await request.json();

    // Flatten the nested schedule into an array of shift objects.
    // Your nested schedule is organized by zone, then by employee.
    // Each employee row has a 'days' object with keys like 'Mon', 'Tue', etc.
    const newShifts = [];
    for (const zone in nestedSchedule) {
      const employees = nestedSchedule[zone];
      for (const employee of employees) {
        // Ensure employee_id and zone_id are set. (You might store these in your employee row.)
        const employee_id = employee.employee_id || employee.employee_name;
        const zone_id = employee.zone_id || employee.zone_name;
        for (const day in employee.days) {
          for (const shift of employee.days[day]) {
            newShifts.push({
              employee_id,
              zone_id,
              role: shift.role,
              shift_date: shift.shift_date,
              start_time: shift.start_time,
              end_time: shift.end_time,
              status: shift.status || 'scheduled'
            });
          }
        }
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

    // Save changes in a transaction.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing schedules in the date range for employees in this restaurant.
      await client.query(
        `DELETE FROM schedules 
         WHERE shift_date BETWEEN $1 AND $2 
           AND employee_id IN (
             SELECT id FROM employees WHERE restaurant_id = $3
           )`,
        [startDate, endDate, restaurantId]
      );

      // Insert each new shift.
      for (const shift of newShifts) {
        await client.query(
          `INSERT INTO schedules (
              employee_id, zone_id, role, shift_date, 
              start_time, end_time, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            shift.employee_id,
            shift.zone_id,
            shift.role,
            shift.shift_date,
            shift.start_time,
            shift.end_time,
            shift.status
          ]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving schedule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in save API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
