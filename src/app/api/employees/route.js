import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT 
        e.*,
        r.name as restaurant_name,
        COALESCE(
          json_agg(DISTINCT er.role) FILTER (WHERE er.role IS NOT NULL), 
          '[]'
        ) as roles,
        COALESCE(
          json_agg(DISTINCT ea.day_of_week) FILTER (WHERE ea.can_cover = true), 
          '[]'
        ) as rest_day_coverage,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'shift_type', esp.shift_type,
            'preferred', esp.preferred
          )) FILTER (WHERE esp.shift_type IS NOT NULL),
          '[]'
        ) as shift_preferences
       FROM employees e
       JOIN restaurants r ON e.restaurant_id = r.id
       LEFT JOIN employee_roles er ON e.id = er.employee_id
       LEFT JOIN employee_availability ea ON e.id = ea.employee_id
       LEFT JOIN employee_shift_preferences esp ON e.id = esp.employee_id
       WHERE r.user_id = $1
       GROUP BY e.id, r.id, r.name`,
      [session.user.id]
    );

    return NextResponse.json({ employees: result.rows });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      first_name, 
      last_name, 
      email, 
      phone,
      roles, // Array of roles, first one is primary
      contract_details,
      days_per_week,
      rest_days, // Array of days ['Monday', 'Tuesday']
      rest_day_coverage, // Array of days they can cover
      restaurant_id,
      shift_preferences
    } = await request.json();

    // First verify the restaurant belongs to the user
    const restaurantCheck = await query(
      'SELECT id FROM restaurants WHERE id = $1 AND user_id = $2',
      [restaurant_id, session.user.id]
    );

    if (restaurantCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Restaurant not found or unauthorized' }, { status: 404 });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create employee
      const employeeResult = await client.query(
        `INSERT INTO employees (
          restaurant_id, first_name, last_name, email, 
          phone, contract_details, days_per_week, rest_days
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [restaurant_id, first_name, last_name, email, 
         phone, contract_details, days_per_week, JSON.stringify(rest_days)]
      );

      const employeeId = employeeResult.rows[0].id;

      // Add roles
      for (const [index, role] of roles.entries()) {
        await client.query(
          `INSERT INTO employee_roles (employee_id, role, is_primary)
           VALUES ($1, $2, $3)`,
          [employeeId, role, index === 0]
        );
      }

      // Add rest day coverage
      for (const day of rest_day_coverage) {
        await client.query(
          `INSERT INTO employee_availability (
            employee_id, day_of_week, is_rest_day, can_cover,
            start_time, end_time
          ) VALUES ($1, $2, true, true, $3, $4)`,
          [employeeId, day, '09:00', '17:00'] // Default shift times
        );
      }

      // Add shift preferences
      for (const shift of ['morning', 'afternoon', 'night']) {
        await client.query(
          `INSERT INTO employee_shift_preferences 
           (employee_id, shift_type, preferred)
           VALUES ($1, $2, $3)`,
          [employeeId, shift, shift_preferences.includes(shift)]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ 
        success: true,
        employee: {
          id: employeeId,
          first_name,
          last_name,
          email,
          phone,
          roles,
          contract_details,
          days_per_week,
          rest_days,
          rest_day_coverage,
          shift_preferences,
          restaurant_id
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (!formData.restaurant_id) {
      throw new Error('Please select a restaurant');
    }
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      throw new Error('Please fill in all required fields');
    }

    if (formData.roles.some(role => !role)) {
      throw new Error('Please select all roles or remove empty ones');
    }

    setStatus({ type: 'loading', message: 'Creating employee...' });
    
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create employee');
    }

    setStatus({ type: 'success', message: 'Employee created successfully!' });
    if (typeof onSuccess === 'function') onSuccess();
  } catch (error) {
    console.error('Error:', error);
    setStatus({ type: 'error', message: error.message });
  }
};