import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

// GET /api/menus/[menuId]
// -> Returns the single menu with ID = menuId
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { menuId } = params;

    const result = await query(
      `SELECT m.* FROM menus m
       JOIN restaurants r ON r.id = m.restaurant_id
       WHERE m.id = $1 AND r.user_id = $2`,
      [menuId, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    return NextResponse.json({ menu: result.rows[0] });
  } catch (err) {
    console.error('Error fetching single menu:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/menus/[menuId]
// -> Update an existing menu with ID = menuId
export async function PUT(request, { params }) {
  try {
    const { menuId } = params; // from /api/menus/10
    const body = await request.json();
    const { name, templateId } = body;

    // Basic validation
    if (!name || !templateId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, templateId' },
        { status: 400 }
      );
    }

    // Update the menu in DB
    const updateResult = await query(
      `
        UPDATE menus
        SET name = $2, template_id = $3
        WHERE id = $1
        RETURNING *
      `,
      [menuId, name, templateId]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    return NextResponse.json({ menu: updateResult.rows[0] });
  } catch (err) {
    console.error('Error updating menu:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/menus/[menuId]
// -> Delete an existing menu with ID = menuId
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { menuId } = params;

    // Verify menu belongs to user
    const menuCheck = await query(
      `SELECT m.id FROM menus m
       JOIN restaurants r ON r.id = m.restaurant_id
       WHERE m.id = $1 AND r.user_id = $2`,
      [menuId, session.user.id]
    );

    if (menuCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Menu not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete menu items first
    await query(
      'DELETE FROM menu_items WHERE menu_id = $1',
      [menuId]
    );

    // Then delete the menu
    const deleteResult = await query(
      'DELETE FROM menus WHERE id = $1 RETURNING *',
      [menuId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting menu:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
