import { NextResponse } from 'next/server';
import { sendSMSToEmployeeForCoverage } from '@/lib/twilio';

export async function POST(request) {
  try {
    const { coverageId } = await request.json();
    await sendSMSToEmployeeForCoverage(coverageId);
    return NextResponse.json({ message: 'SMS sent successfully' });
  } catch (error) {
    console.error("Error sending SMS coverage request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 