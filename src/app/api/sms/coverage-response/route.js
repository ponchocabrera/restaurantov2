import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import twilio from 'twilio';

// Helper function (could also be moved to a shared module)
async function processCoverageResponse(coverageId, userResponse) {
  const client = await pool.connect();
  try {
    // Check if userResponse is null or empty and handle accordingly.
    if (!userResponse) {
      console.log(`No SMS response provided for coverageId: ${coverageId}`);
      return "We did not receive any response. Please reply YES or NO.";
    }
    
    const normalizedResponse = userResponse.trim().toLowerCase();
    let message;

    if (normalizedResponse.includes('yes')) {
      console.log(`Updating schedule ${coverageId} to confirmed based on user response.`);
      await client.query(
        `UPDATE schedules SET coverage_status = 'confirmed' WHERE id = $1`,
        [coverageId]
      );
      message = "Thank you. Your response has been recorded as confirmed.";
    } else if (normalizedResponse.includes('no')) {
      console.log(`Updating schedule ${coverageId} to denied based on user response.`);
      await client.query(
        `UPDATE schedules SET coverage_status = 'denied' WHERE id = $1`,
        [coverageId]
      );
      message = "Thank you. Your response has been recorded as denied.";
    } else {
      console.log(`Unrecognized response for schedule ${coverageId}: ${userResponse}`);
      message = "Sorry, we didn't understand your response. Please reply YES or NO.";
    }

    return message;
  } finally {
    client.release();
  }
}

export async function POST(request) {
  // Twilio sends incoming SMS data as form data.
  const formData = await request.formData();
  const smsBody = formData.get('Body');
  
  // Assume that you include the coverageId in the webhook URL
  const baseUrl = (process.env.TWILIO_BASE_URL || '').replace(/\/api\/?$/, '');
  const responseUrl = `${baseUrl}/api/sms/coverage-response?coverageId=${coverageId}`;

  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  try {
    const responseMessage = await processCoverageResponse(coverageId, smsBody);
    twiml.message(responseMessage);
  } catch (error) {
    console.error("Error processing SMS reply:", error);
    twiml.message("An error occurred while processing your response. Please try again later.");
  }
  
  return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
}

// Example function that sends an SMS with a coverage response URL.
function sendCoverageResponseSMS(coverageId, phone) {
  // Assume API_BASE_URL is "https://.../api"
  const coverageUrl = `${process.env.API_BASE_URL}/sms/coverage-response?coverageId=${coverageId}`;
  console.log("Sending SMS with URL:", coverageUrl);
  
  // (Your SMS sending logic would go here.)
} 