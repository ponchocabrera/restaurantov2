// [D] pages/api/restaurantsProfile/[id].js or app/api/restaurantsProfile/[id]/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { data, colorPalette } = await request.json();
    
    const result = await query(
      `UPDATE restaurants_profile rp
       SET data = $1,
           color_palette = $2,
           updated_at = NOW()
       FROM restaurants r
       WHERE rp.restaurant_id = r.id
       AND r.user_id = $3
       AND rp.id = $4
       RETURNING rp.id, rp.data, rp.color_palette`,
      [data, colorPalette, session.user.id, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
