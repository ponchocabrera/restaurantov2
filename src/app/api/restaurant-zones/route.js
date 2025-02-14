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

    const { name, description, roles_needed } = await request.json();

    // First, get the restaurant_id for the current user
    const restaurantResult = await query(
      'SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1',
      [session.user.id]
    );

    if (restaurantResult.rows.length === 0) {
      return NextResponse.json({ error: 'No restaurant found' }, { status: 404 });
    }

    const restaurantId = restaurantResult.rows[0].id;

    // Create the zone
    const zoneResult = await query(
      `INSERT INTO restaurant_zones (name, description, restaurant_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, description, restaurantId]
    );

    const zoneId = zoneResult.rows[0].id;

    // Insert all the roles needed for this zone
    for (const role of roles_needed) {
      await query(
        `INSERT INTO zone_roles_needed (
          zone_id,
          day_of_week,
          role,
          required_count,
          shift_time,
          shift_start,
          shift_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          zoneId,
          role.day_of_week,
          role.role,
          role.required_count,
          role.shift_time,
          role.shift_start,
          role.shift_end
        ]
      );
    }

    return NextResponse.json({ 
      success: true,
      zone: { id: zoneId, name, description }
    });

  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get restaurant ID for the current user
    const restaurantResult = await query(
      'SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1',
      [session.user.id]
    );

    if (restaurantResult.rows.length === 0) {
      return NextResponse.json({ error: 'No restaurant found' }, { status: 404 });
    }

    const restaurantId = restaurantResult.rows[0].id;

    // Fetch zones with their roles
    const zones = await query(
      `SELECT z.*, 
        json_agg(
          json_build_object(
            'day_of_week', zr.day_of_week,
            'role', zr.role,
            'required_count', zr.required_count,
            'shift_time', zr.shift_time,
            'shift_start', zr.shift_start,
            'shift_end', zr.shift_end
          )
        ) as roles_needed
       FROM restaurant_zones z
       LEFT JOIN zone_roles_needed zr ON 
         z.id = zr.zone_id AND
         zr.required_count > 0
       WHERE z.restaurant_id = $1
       GROUP BY z.id`,
      [restaurantId]
    );

    return NextResponse.json({ zones: zones.rows });
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 