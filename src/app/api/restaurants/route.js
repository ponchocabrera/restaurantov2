import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';

// GET /api/restaurants -> Returns all restaurants
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Add detailed debugging
    console.log('API - Session Debug:', {
      hasSession: !!session,
      sessionDetails: session,
      headers: Object.fromEntries(request.headers),
    });

    if (!session) {
      console.log('No session found in API route');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.id) {
      console.log('No user ID in session:', session);
      return NextResponse.json({ error: 'Unauthorized - No user ID' }, { status: 401 });
    }

    const result = await query(
      'SELECT * FROM restaurants WHERE user_id = $1',
      [session.user.id]
    );
    
    return NextResponse.json({ restaurants: result.rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/restaurants -> Creates a new restaurant
// Expects { "restaurantName": "..." } in the request body
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('Session validation failed:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        fullSession: session
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO restaurants (name, user_id)
       VALUES ($1, $2)
       RETURNING id, name`,
      [name, session.user.id]
    );

    return NextResponse.json({ restaurant: result.rows[0] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


