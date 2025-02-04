import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify the menu item belongs to the user
    const itemCheck = await query(
      `SELECT mi.id 
       FROM menu_items mi
       JOIN menus m ON m.id = mi.menu_id
       JOIN restaurants r ON r.id = m.restaurant_id
       WHERE mi.id = $1 AND r.user_id = $2`,
      [id, session.user.id]
    );

    if (itemCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the menu item
    await query(
      'DELETE FROM menu_items WHERE id = $1',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 