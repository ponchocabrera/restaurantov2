import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const result = await query(
      'SELECT * FROM restaurants WHERE id = $1 AND user_id = $2',
      [id, session.user.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ restaurant: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    );
  }
}

// UPDATE (PUT) - full update example
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { name } = await request.json();
    const result = await query(
      'UPDATE restaurants SET name = $2 WHERE id = $1 AND user_id = $3 RETURNING *',
      [id, name, session.user.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ restaurant: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // First verify the restaurant belongs to the user
    const ownerCheck = await query(
      'SELECT id FROM restaurants WHERE id = $1 AND user_id = $2',
      [id, session.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all menus for this restaurant
    const menusResult = await query(
      'SELECT id FROM menus WHERE restaurant_id = $1',
      [id]
    );

    // Delete all menu items for each menu
    for (const menu of menusResult.rows) {
      await query(
        'DELETE FROM menu_items WHERE menu_id = $1',
        [menu.id]
      );
    }

    // Delete all menus
    await query(
      'DELETE FROM menus WHERE restaurant_id = $1',
      [id]
    );

    // Finally delete the restaurant
    const result = await query(
      'DELETE FROM restaurants WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Restaurant and all related data deleted successfully',
      restaurant: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to delete restaurant' },
      { status: 500 }
    );
  }
}
