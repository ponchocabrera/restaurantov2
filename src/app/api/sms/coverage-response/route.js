import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import twilio from 'twilio';

export async function POST(request) {
  // Twilio sends incoming SMS data as form data.
  const formData = await request.formData();
  const smsBody = formData.get('Body');
  const from = formData.get('From');
  
  // For example, you might include the coverageId in the webhook URL query parameters.
  const url = new URL(request.url);
  const coverageId = url.searchParams.get('coverageId');

  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  try {
    const client = await pool.connect();
    try {
      if (smsBody.trim().toLowerCase().includes('yes')) {
        console.log(`Updating schedule ${coverageId} to confirmed based on SMS reply.`);
        await client.query(
          `UPDATE schedules SET coverage_status = 'confirmed' WHERE id = $1`,
          [coverageId]
        );
        twiml.message("Thank you. Your response has been recorded as confirmed.");
      } else if (smsBody.trim().toLowerCase().includes('no')) {
        console.log(`Updating schedule ${coverageId} to denied based on SMS reply.`);
        await client.query(
          `UPDATE schedules SET coverage_status = 'denied' WHERE id = $1`,
          [coverageId]
        );
        twiml.message("Thank you. Your response has been recorded as denied.");
      } else {
        twiml.message("Sorry, we didn't understand your response. Please reply YES or NO.");
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error processing SMS reply:", error);
  }
  
  return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
} 