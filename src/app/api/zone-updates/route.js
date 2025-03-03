import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getRecentZoneUpdates, runZoneMonitoring } from '@/lib/zone-monitoring';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updates = await getRecentZoneUpdates(session.user.id);
    return NextResponse.json({ updates });
  } catch (error) {
    console.error('Error fetching zone updates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// For manual triggering (admin only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Manually trigger the zone monitoring
    await runZoneMonitoring();
    
    return NextResponse.json({ success: true, message: 'Zone monitoring triggered successfully' });
  } catch (error) {
    console.error('Error triggering zone monitoring:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 