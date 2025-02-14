import { NextResponse } from 'next/server';
import { generateSchedule } from '@/lib/scheduling/scheduler';
import { analyzeSchedule } from '@/lib/scheduling/schedule-analyzer';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { pool } from '@/lib/db';

export async function POST(request) {
  try {
    // Verify the user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate } = await request.json();

    // 1. Generate the schedule with the new logic
    const schedule = await generateSchedule(session.user.id, startDate, endDate);
    // 2. Analyze schedule if needed
    const analyzedResult = await analyzeSchedule(schedule);

    // 3. Save the schedule into the DB (transaction)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing schedules for the date range
      await client.query(
        `DELETE FROM schedules WHERE shift_date BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      // Insert each new shift
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

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Return the final schedule and analysis
    return NextResponse.json({
      success: true,
      schedule: analyzedResult.schedule,
      metrics: analyzedResult.metrics,
      analysis: analyzedResult.analysis
    });
  } catch (error) {
    console.error('Schedule generation failed:', error);
    return NextResponse.json({
      error: error.message,
      schedule: [],
      metrics: { totalShifts: 0, warnings: ['Schedule generation failed'] }
    }, { status: 500 });
  }
}
