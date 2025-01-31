import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { menuId } = params;

    if (!menuId) {
      return NextResponse.json(
        { error: 'Menu ID is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ items: result.rows });

  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}
