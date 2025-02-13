// src/app/api/schedules/weeks/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch weeks with schedules
    const result = await query(
      `
      SELECT DISTINCT DATE_TRUNC('week', shift_date) AS week_start
      FROM schedules
      WHERE shift_date IS NOT NULL
      ORDER BY week_start ASC
      `
    );

    const weeks = result.rows.map(row => row.week_start.toISOString().split('T')[0]);

    return NextResponse.json({ weeks });
  } catch (error) {
    console.error('Error fetching generated weeks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}