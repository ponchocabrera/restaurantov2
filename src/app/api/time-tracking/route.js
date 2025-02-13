import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId, type, location } = await request.json();
    
    const result = await query(
      `INSERT INTO time_tracking (
        employee_id, 
        type, 
        location_data, 
        timestamp
      ) VALUES ($1, $2, $3, NOW()) 
      RETURNING *`,
      [employeeId, type, JSON.stringify(location)]
    );

    return NextResponse.json({ timeRecord: result.rows[0] });
  } catch (error) {
    console.error('Error recording time:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const result = await query(
      `SELECT t.*, e.name as employee_name 
       FROM time_tracking t
       JOIN employees e ON t.employee_id = e.id
       WHERE ($1::int IS NULL OR t.employee_id = $1)
       AND t.timestamp BETWEEN $2 AND $3
       ORDER BY t.timestamp DESC`,
      [employeeId, startDate, endDate]
    );

    return NextResponse.json({ records: result.rows });
  } catch (error) {
    console.error('Error fetching time records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 