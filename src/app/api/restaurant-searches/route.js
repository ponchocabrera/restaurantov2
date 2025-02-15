import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await query(
      "SELECT * FROM restaurant_searches WHERE user_id = $1 ORDER BY created_at DESC",
      [session.user.id]
    );
    return NextResponse.json({ searches: result.rows });
  } catch (error) {
    console.error("Error fetching restaurant searches:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 