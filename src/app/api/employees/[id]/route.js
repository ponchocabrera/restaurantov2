import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function DELETE(request, { params }) {
  const { id } = params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear foreign key references in coverage_requests for this employee.
    await client.query(
      "UPDATE coverage_requests SET replacement_employee = NULL WHERE replacement_employee = $1",
      [id]
    );
    await client.query(
      "UPDATE coverage_requests SET requested_by = NULL WHERE requested_by = $1",
      [id]
    );

    // Delete the employee record.
    await client.query("DELETE FROM employees WHERE id = $1", [id]);

    await client.query('COMMIT');
    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
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

    // Use a transaction to update the main employee record and related tables.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update main employee record. We now include contract_details.
      const employeeResult = await client.query(
        `UPDATE employees 
         SET first_name = $1, last_name = $2, email = $3, 
             phone = $4, days_per_week = $5, rest_days = $6,
             contract_details = $7
         WHERE id = $8
         RETURNING *`,
        [
          updates.first_name,
          updates.last_name,
          updates.email,
          updates.phone,
          updates.days_per_week,
          JSON.stringify(updates.rest_days),
          JSON.stringify(updates.contract_details),
          id
        ]
      );

      // Update roles: Remove old roles and insert the new ones.
      await client.query('DELETE FROM employee_roles WHERE employee_id = $1', [id]);
      if (updates.roles && updates.roles.length) {
        for (const [index, role] of updates.roles.entries()) {
          await client.query(
            `INSERT INTO employee_roles (employee_id, role, is_primary)
             VALUES ($1, $2, $3)`,
            [id, role, index === 0] // assume first role is primary
          );
        }
      }

      // Update shift preferences: Remove old preferences and insert the updated ones.
      await client.query('DELETE FROM employee_shift_preferences WHERE employee_id = $1', [id]);
      if (updates.shift_preferences) {
        for (const shiftType of Object.keys(updates.shift_preferences)) {
          await client.query(
            `INSERT INTO employee_shift_preferences (employee_id, shift_type, preferred)
             VALUES ($1, $2, $3)`,
            [id, shiftType, updates.shift_preferences[shiftType]]
          );
        }
      }

      await client.query('COMMIT');
      return NextResponse.json({ employee: employeeResult.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 