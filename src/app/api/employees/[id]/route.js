import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function DELETE(request, { params }) {
  const { id } = params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete related records first
      await client.query('DELETE FROM employee_roles WHERE employee_id = $1', [id]);
      await client.query('DELETE FROM employee_availability WHERE employee_id = $1', [id]);
      await client.query('DELETE FROM employees WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    
    const result = await query(
      `UPDATE employees 
       SET first_name = $1, last_name = $2, email = $3, 
           phone = $4, days_per_week = $5, rest_days = $6
       WHERE id = $7
       RETURNING *`,
      [
        updates.first_name,
        updates.last_name,
        updates.email,
        updates.phone,
        updates.days_per_week,
        JSON.stringify(updates.rest_days),
        id
      ]
    );

    return NextResponse.json({ employee: result.rows[0] });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 