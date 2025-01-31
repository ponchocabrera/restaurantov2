import { NextResponse } from 'next/server';
import { query } from '@/lib/db';  // Use the same db utility as other routes

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
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');

    if (!menuId) {
      return NextResponse.json(
        { error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    try {
      const result = await query(
        `SELECT 
          id,
          name,
          description,
          price,
          category,
          sales_performance,
          margin_level,
          boost_desired
        FROM menu_items 
        WHERE menu_id = $1
        ORDER BY category, name`,
        [menuId]
      );
      
      if (!result.rows || result.rows.length === 0) {
        console.log('No items found for menuId:', menuId);
        return NextResponse.json({ items: [] });
      }

      console.log(`Found ${result.rows.length} items for menuId:`, menuId);
      return NextResponse.json({ items: result.rows });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error: ' + dbError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
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

    console.log('[POST /api/menuItems] Incoming body:', body);

    if (sales_performance === '') sales_performance = null;
    if (margin_level === '') margin_level = null;

    if (!menuId || !name) {
      console.warn('[POST /api/menuItems] Missing menuId or name');
      return NextResponse.json(
        { error: 'Missing required fields: menuId or name' },
        { status: 400 }
      );
    }

    if (
      sales_performance &&
      !['best_seller', 'regular_seller', 'not_selling'].includes(sales_performance)
    ) {
      return NextResponse.json(
        { error: 'Invalid sales_performance value' },
        { status: 400 }
      );
    }
    
    if (
      margin_level &&
      !['high_margin', 'mid_margin', 'low_margin', 'red_margin'].includes(margin_level)
    ) {
      return NextResponse.json(
        { error: 'Invalid margin_level value' },
        { status: 400 }
      );
    }

    if (id) {
      const checkResult = await query(
        `SELECT menu_id FROM menu_items WHERE id = $1`,
        [id]
      );
      
      if (checkResult.rowCount === 0) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      
      const existingItem = checkResult.rows[0];
      if (existingItem.menu_id !== Number(menuId)) {
        console.warn(
          '[POST /api/menuItems] Mismatched menuId. ' +
          `Item belongs to menu_id=${existingItem.menu_id}, but got menuId=${menuId}.`
        );
        return NextResponse.json(
          { error: 'Cannot change menuId of an existing item.' },
          { status: 400 }
        );
      }

      const updateResult = await query(
        `UPDATE menu_items
        SET name = $1, description = $2, price = $3, category = $4, 
            image_url = $5, sales_performance = $6, margin_level = $7, 
            boost_desired = $8
        WHERE id = $9
        RETURNING *`,
        [name, description, price, category, image_url, sales_performance, margin_level, boost_desired, id]
      );

      if (updateResult.rowCount === 0) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      console.log('[POST /api/menuItems] Updated item:', updateResult.rows[0]);
      return NextResponse.json({ item: updateResult.rows[0] });
    } else {
      const insertResult = await query(
        `INSERT INTO menu_items 
        (menu_id, name, description, price, category, image_url, 
         sales_performance, margin_level, boost_desired)
        VALUES ($1, $2, $3, $4, $5, $6,
         $7, $8, $9)
        RETURNING *`,
        [menuId, name, description, price, category, image_url, sales_performance, margin_level, boost_desired]
      );

      console.log('[POST /api/menuItems] Created new item:', insertResult.rows[0]);
      return NextResponse.json({ item: insertResult.rows[0] }, { status: 201 });
    }
  } catch (err) {
    console.error('Error creating/updating menu item:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
