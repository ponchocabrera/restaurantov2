import { pool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      'SELECT * FROM restaurants WHERE user_id = $1',
      [session.user.id]
    );

    return Response.json({ 
      restaurants: result.rows,
      success: true 
    });

  } catch (error) {
    console.error('Error fetching user restaurants:', error);
    return Response.json({ 
      error: 'Failed to fetch restaurants',
      details: error.message 
    }, { status: 500 });
  }
} 