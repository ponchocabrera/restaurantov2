import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

const VALID_MARGIN_LEVELS = ['low', 'medium', 'high', null];
const VALID_SALES_PERFORMANCE = ['low', 'medium', 'high', 'best_seller', null];

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { menuId, items } = await request.json();

    // Validate and sanitize items
    const sanitizedItems = items.map(item => ({
      id: item.id || null,  // Include id for existing items
      ...item,
      margin_level: VALID_MARGIN_LEVELS.includes(item.margin_level) ? item.margin_level : null,
      sales_performance: VALID_SALES_PERFORMANCE.includes(item.sales_performance) ? item.sales_performance : null,
      description: item.description || '',
      price: item.price || 0,
      category: item.category || '',
      image_url: item.image_url || '',
      boost_desired: !!item.boost_desired
    }));

    // Verify menu belongs to user
    const menuCheck = await query(
      `SELECT m.id FROM menus m
       JOIN restaurants r ON r.id = m.restaurant_id
       WHERE m.id = $1 AND r.user_id = $2`,
      [menuId, session.user.id]
    );

    if (menuCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Menu not found or unauthorized' }, { status: 404 });
    }

    // Build bulk insert/update query
    const result = await query(
      `WITH input_rows AS (
         SELECT * FROM jsonb_to_recordset($3::jsonb) AS x(
           id int,
           name text,
           description text,
           price numeric,
           category text,
           image_url text,
           sales_performance text,
           margin_level text,
           boost_desired boolean
         )
       ),
       inserted_rows AS (
         INSERT INTO menu_items 
           (menu_id, name, description, price, category, image_url, 
            sales_performance, margin_level, boost_desired, user_id)
         SELECT 
           $1, i.name, i.description, i.price, i.category, i.image_url,
           i.sales_performance, i.margin_level, i.boost_desired, $2
         FROM input_rows i
         WHERE i.id IS NULL
         RETURNING *
       ),
       updated_rows AS (
         UPDATE menu_items m
         SET 
           name = i.name,
           description = i.description,
           price = i.price,
           category = i.category,
           image_url = i.image_url,
           sales_performance = i.sales_performance,
           margin_level = i.margin_level,
           boost_desired = i.boost_desired
         FROM input_rows i
         WHERE m.id = i.id AND m.menu_id = $1 AND i.id IS NOT NULL
         RETURNING m.*
       )
       SELECT * FROM inserted_rows
       UNION ALL
       SELECT * FROM updated_rows`,
      [menuId, session.user.id, JSON.stringify(sanitizedItems)]
    );

    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error('Bulk save error:', error);
    return NextResponse.json({ 
      error: 'Failed to save menu items', 
      details: error.message 
    }, { status: 500 });
  }
} 