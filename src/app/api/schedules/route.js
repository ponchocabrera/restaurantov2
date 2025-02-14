import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';
import { generateSchedule } from '@/lib/employee-management/scheduler';
import { analyzeSchedule } from '@/lib/scheduling/schedule-analyzer';

/**
 * GET /api/schedules?startDate=...&endDate=...
 * Fetch schedules for a given date range, joining employees and zones.
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch schedules within the date range, joined with employees and zones
    const result = await query(
      `
      SELECT
        s.*,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        z.name AS zone_name,
        e.role AS employee_role,
        COALESCE(MAX(zr.required_count), 0) AS required_count
      FROM schedules s
      JOIN employees e ON s.employee_id = e.id
      JOIN restaurant_zones z ON s.zone_id = z.id
      LEFT JOIN zone_roles_needed zr ON 
        zr.zone_id = z.id AND
        TRIM(TO_CHAR(s.shift_date, 'Day')) ILIKE zr.day_of_week AND
        zr.role = s.role
      WHERE s.shift_date BETWEEN $1 AND $2
        AND e.restaurant_id = (
          SELECT id FROM restaurants WHERE user_id = $3 LIMIT 1
        )
      GROUP BY s.id, e.id, z.id
      ORDER BY s.shift_date ASC, s.start_time ASC
      `,
      [startDate, endDate, session.user.id]
    );

    return NextResponse.json({ schedules: result.rows });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/schedules/past?startDate=...&endDate=...
 * Fetch past schedules for a given date range, joining employees and zones.
 */
export async function GET_PAST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Find the restaurant associated with this user
    const restaurant = await query(
      'SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1',
      [session.user.id]
    );
    if (!restaurant.rows.length) {
      throw new Error('Restaurant not found');
    }

    // Fetch past schedules within the date range, joined with employees and zones
    const result = await query(
      `
      SELECT
        s.*,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        z.name AS zone_name,
        e.role AS employee_role
      FROM schedules s
      JOIN employees e ON s.employee_id = e.id
      JOIN restaurant_zones z ON s.zone_id = z.id
      WHERE s.shift_date BETWEEN $1 AND $2
        AND e.restaurant_id = $3
      ORDER BY s.shift_date ASC, s.start_time ASC
      `,
      [startDate, endDate, restaurant.rows[0].id]
    );

    return NextResponse.json({ schedules: result.rows });
  } catch (error) {
    console.error('Error fetching past schedules:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/schedules
 * 1. Generate a new schedule for the given date range.
 * 2. Save it to the DB (deleting any prior shifts in that range).
 * 3. Return the final schedule with employee_name and zone_name.
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { startDate, endDate } = await request.json();

    // 1. Generate and analyze the schedule with the updated logic
    const scheduleResult = await generateSchedule(session.user.id, startDate, endDate);
    const analyzedResult = await analyzeSchedule(scheduleResult);

    // 2. Find the restaurant
    const restaurantRes = await query(
      'SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1',
      [session.user.id]
    );
    if (!restaurantRes.rows.length) {
      throw new Error('Restaurant not found');
    }
    const restaurantId = restaurantRes.rows[0].id;

    // 3. Save the schedule (transaction)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Delete existing schedules in the date range
      await client.query(
        `DELETE FROM schedules
         WHERE shift_date BETWEEN $1 AND $2`,
        [startDate, endDate]
      );
      // Insert new shifts
      for (const shift of analyzedResult.schedule) {
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

      // 4. Join to get employee & zone names
      const finalResult = await client.query(
        `
        SELECT
          s.*,
          CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
          z.name AS zone_name,
          e.role AS employee_role
        FROM schedules s
        JOIN employees e ON s.employee_id = e.id
        JOIN restaurant_zones z ON s.zone_id = z.id
        WHERE s.shift_date BETWEEN $1 AND $2
          AND e.restaurant_id = $3
        ORDER BY s.shift_date ASC, s.start_time ASC
        `,
        [startDate, endDate, restaurantId]
      );

      await client.query('COMMIT');

      // Return final schedule & analysis
      return NextResponse.json({
        success: true,
        schedule: finalResult.rows,
        metrics: analyzedResult.metrics,
        analysis: analyzedResult.analysis
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error generating schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const fetchPastSchedules = async (startDate, endDate) => {
  const response = await fetch(`/api/schedules/past?startDate=${startDate}&endDate=${endDate}`);
  if (!response.ok) {
    throw new Error('Failed to fetch past schedules');
  }
  const data = await response.json();
  return data.schedules;
};
