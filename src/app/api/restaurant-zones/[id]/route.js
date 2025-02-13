import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { name, description, roles_needed } = await request.json();

    // Verify ownership
    const ownerCheck = await query(
      `SELECT z.id 
       FROM restaurant_zones z
       JOIN restaurants r ON r.id = z.restaurant_id
       WHERE z.id = $1 AND r.user_id = $2`,
      [id, session.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Zone not found or unauthorized' }, { status: 404 });
    }

    // Update zone details
    await query(
      'UPDATE restaurant_zones SET name = $1, description = $2 WHERE id = $3',
      [name, description, id]
    );

    // Delete existing roles
    await query('DELETE FROM zone_roles_needed WHERE zone_id = $1', [id]);

    // Insert new roles
    for (const role of roles_needed) {
      await query(
        `INSERT INTO zone_roles_needed (
          zone_id, day_of_week, role, required_count,
          shift_time, shift_start, shift_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, role.day_of_week, role.role, role.required_count,
         role.shift_time, role.shift_start, role.shift_end]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating zone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // First verify the zone belongs to the user's restaurant
    const ownerCheck = await query(
      `SELECT z.id 
       FROM restaurant_zones z
       JOIN restaurants r ON r.id = z.restaurant_id
       WHERE z.id = $1 AND r.user_id = $2`,
      [id, session.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Zone not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete zone roles first (foreign key constraint)
    await query('DELETE FROM zone_roles_needed WHERE zone_id = $1', [id]);
    
    // Then delete the zone
    await query('DELETE FROM restaurant_zones WHERE id = $1', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 