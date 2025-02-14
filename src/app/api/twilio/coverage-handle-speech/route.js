import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import twilio from 'twilio';

export async function POST(request) {
  const formData = await request.formData();
  const speechResult = formData.get('SpeechResult');
  const coverageId = new URL(request.url).searchParams.get('coverageId');
  console.log("SpeechResult:", speechResult, "for coverageId:", coverageId);

  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  if (speechResult) {
    const normalizedResult = speechResult.toLowerCase();
    try {
      const client = await pool.connect();
      try {
        if (normalizedResult.includes('yes')) {
          console.log(`Updating schedule ${coverageId} to confirmed based on speech input.`);
          const updateResult = await client.query(
            `UPDATE schedules
             SET coverage_status = 'confirmed'
             WHERE id = $1
             RETURNING *`,
            [coverageId]
          );
          if (updateResult.rowCount > 0) {
            twiml.say("Thank you. Your response has been recorded as confirmed.", { voice: "alice" });
          } else {
            twiml.say("No pending shift found to confirm.", { voice: "alice" });
          }
        } else if (normalizedResult.includes('no')) {
          console.log(`Updating schedule ${coverageId} to denied based on speech input.`);
          const updateResult = await client.query(
            `UPDATE schedules
             SET coverage_status = 'denied'
             WHERE id = $1
             RETURNING *`,
            [coverageId]
          );
          if (updateResult.rowCount > 0) {
            twiml.say("Thank you. Your response has been recorded as denied.", { voice: "alice" });
          } else {
            twiml.say("No pending shift found to update.", { voice: "alice" });
          }
        } else {
          twiml.say("We did not understand your response. Goodbye.", { voice: "alice" });
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error handling speech input:", err);
      twiml.say("There was an error processing your response. Goodbye.", { voice: "alice" });
    }
  } else {
    twiml.say("We did not receive your response. Goodbye.", { voice: "alice" });
  }

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" }
  });
}
