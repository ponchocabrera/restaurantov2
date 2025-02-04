import { NextResponse } from 'next/server';
import { query } from '@/lib/db';  // Use the same db utility as other routes
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';

// Fallback data for development
const fallbackItems = {
  13: [
    {
      id: 1,
      name: 'Margherita Pizza',
      description: 'Fresh tomatoes, mozzarella, and basil',
      price: 12.99,
      category: 'Pizza',
      sales_performance: 'best_seller',
      margin_level: 'high_margin',
      boost_desired: true
    },
    {
      id: 2,
      name: 'Caesar Salad',
      description: 'Romaine lettuce, croutons, parmesan',
      price: 8.99,
      category: 'Salads',
      sales_performance: 'normal',
      margin_level: 'normal',
      boost_desired: false
    }
  ]
};

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');

    if (!menuId) {
      return NextResponse.json(
        { error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT mi.* 
       FROM menu_items mi
       JOIN menus m ON m.id = mi.menu_id
       JOIN restaurants r ON r.id = m.restaurant_id
       WHERE mi.menu_id = $1 AND r.user_id = $2
       ORDER BY mi.category, mi.name`,
      [menuId, session.user.id]
    );

    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let {
      id,
      menuId,
      name,
      description = '',
      price = 0,
      category = '',
      image_url = '',
      sales_performance = null,
      margin_level = null,
      boost_desired = false
    } = body;

    // Validate margin_level
    const validMarginLevels = ['low', 'medium', 'high', null];
    if (!validMarginLevels.includes(margin_level)) {
      margin_level = null;
    }

    // Validate sales_performance
    const validSalesPerformance = ['low', 'medium', 'high', 'best_seller', null];
    if (!validSalesPerformance.includes(sales_performance)) {
      sales_performance = null;
    }

    if (!menuId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: menuId or name' },
        { status: 400 }
      );
    }

    // Verify menu belongs to user
    const menuCheck = await query(
      `SELECT m.id 
       FROM menus m
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

    if (id) {
      const updateResult = await query(
        `UPDATE menu_items
         SET name = $1, description = $2, price = $3, category = $4, 
             image_url = $5, sales_performance = $6, margin_level = $7, 
             boost_desired = $8
         WHERE id = $9 AND menu_id = $10
         RETURNING *`,
        [name, description, price, category, image_url, 
         sales_performance, margin_level, boost_desired, id, menuId]
      );

      if (updateResult.rowCount === 0) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      return NextResponse.json({ item: updateResult.rows[0] });
    } else {
      const insertResult = await query(
        `INSERT INTO menu_items 
         (menu_id, name, description, price, category, image_url, 
          sales_performance, margin_level, boost_desired, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [menuId, name, description, price, category, image_url,
         sales_performance, margin_level, boost_desired, session.user.id]
      );

      return NextResponse.json({ item: insertResult.rows[0] }, { status: 201 });
    }
  } catch (error) {
    console.error('Menu item operation failed:', error);
    return NextResponse.json(
      { error: 'Failed to process menu item', details: error.message },
      { status: 500 }
    );
  }
}
