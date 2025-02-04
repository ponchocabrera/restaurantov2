import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';

/**
 * GET /api/menus
 * If ?restaurantId=123 is provided, filter by that restaurant.
 * Otherwise, return all menus.
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (restaurantId) {
      const result = await query(
        `SELECT m.* FROM menus m
         JOIN restaurants r ON r.id = m.restaurant_id
         WHERE r.user_id = $1 AND r.id = $2`,
        [session.user.id, restaurantId]
      );
      return NextResponse.json({ menus: result.rows });
    } else {
      const result = await query(
        `SELECT m.* FROM menus m
         JOIN restaurants r ON r.id = m.restaurant_id
         WHERE r.user_id = $1`,
        [session.user.id]
      );
      return NextResponse.json({ menus: result.rows });
    }
  } catch (err) {
    console.error('Error fetching menus:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/menus
 * Upsert (create or update) a menu:
 * - If body.id exists, update the menu
 * - Otherwise, insert a new menu
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, restaurantId, name, templateId } = await request.json();

    if (!restaurantId || !name || !templateId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: restaurantId, name, or templateId',
        },
        { status: 400 }
      );
    }

    // Verify restaurant belongs to user
    const restaurantCheck = await query(
      'SELECT id FROM restaurants WHERE id = $1 AND user_id = $2',
      [restaurantId, session.user.id]
    );

    if (restaurantCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant not found or unauthorized' },
        { status: 404 }
      );
    }

    if (id) {
      const updateResult = await query(
        `UPDATE menus
         SET name = $2, template_id = $3
         WHERE id = $1 AND restaurant_id = $4
         RETURNING *`,
        [id, name, templateId, restaurantId]
      );

      if (updateResult.rowCount === 0) {
        return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
      }

      return NextResponse.json({ menu: updateResult.rows[0] });
    } else {
      const insertResult = await query(
        `INSERT INTO menus (restaurant_id, name, template_id, user_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [restaurantId, name, templateId, session.user.id]
      );

      return NextResponse.json({ menu: insertResult.rows[0] }, { status: 201 });
    }
  } catch (err) {
    console.error('Error upserting menu:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/menus?menuId=123
 * Deletes the specified menu
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');

    if (!menuId) {
      return NextResponse.json(
        { error: 'Missing menuId parameter' },
        { status: 400 }
      );
    }

    const deleteResult = await query(
      'DELETE FROM menus WHERE id = $1 RETURNING *',
      [menuId]
    );

    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting menu:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
