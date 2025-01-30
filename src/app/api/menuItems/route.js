import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');

    if (!menuId) {
      return NextResponse.json(
        { error: 'Missing menuId parameter' },
        { status: 400 }
      );
    }

    console.log('[GET /api/menuItems] Fetching items for menuId=', menuId);

    const result = await query(
      'SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY id ASC',
      [menuId]
    );

    return NextResponse.json({ menuItems: result.rows });
  } catch (err) {
    console.error('Error fetching menu items:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // [1] Destructure fields from request
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

    // [2] If the user or frontend is sending "" for no selection,
    //     convert it to null so it passes the constraint:
    if (sales_performance === '') {
      sales_performance = null;
    }
    if (margin_level === '') {
      margin_level = null;
    }

    // [3] If your constraint requires one of these or NULL,
    //     you can optionally handle a default. For example:
    // if (!sales_performance) {
    //   sales_performance = 'not_selling'; // Or some default you want
    // }

    // Validate required fields
    if (!menuId || !name) {
      console.warn('[POST /api/menuItems] Missing menuId or name');
      return NextResponse.json(
        { error: 'Missing required fields: menuId or name' },
        { status: 400 }
      );
    }

    // [4] Validate enum fields if they are not null
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

    // [5] If "id" exists, we do an UPDATE; otherwise INSERT a new record.
    if (id) {
      // Check existing item
      const checkResult = await query(
        'SELECT menu_id FROM menu_items WHERE id = $1',
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

      // [6] UPDATED UPDATE query
      const updateResult = await query(
        `
          UPDATE menu_items
          SET name = $2, description = $3, price = $4, category = $5, 
              image_url = $6, sales_performance = $7, margin_level = $8, 
              boost_desired = $9
          WHERE id = $1
          RETURNING *
        `,
        [
          id,
          name,
          description,
          price,
          category,
          image_url,
          sales_performance, // using the possibly-nullified value
          margin_level,
          boost_desired
        ]
      );

      if (updateResult.rowCount === 0) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      console.log('[POST /api/menuItems] Updated item:', updateResult.rows[0]);
      return NextResponse.json({ item: updateResult.rows[0] });
    } else {
      // [7] UPDATED INSERT query
      const insertResult = await query(
        `
          INSERT INTO menu_items 
          (menu_id, name, description, price, category, image_url, 
           sales_performance, margin_level, boost_desired)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `,
        [
          menuId,
          name,
          description,
          price,
          category,
          image_url,
          sales_performance, // using the possibly-nullified value
          margin_level,
          boost_desired
        ]
      );

      console.log('[POST /api/menuItems] Created new item:', insertResult.rows[0]);
      return NextResponse.json({ item: insertResult.rows[0] }, { status: 201 });
    }
  } catch (err) {
    console.error('Error creating/updating menu item:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
