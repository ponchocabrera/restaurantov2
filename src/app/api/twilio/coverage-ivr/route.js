// File: src/app/api/twilio/coverage-ivr/route.js
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import twilio from 'twilio';
import express from 'express';

const router = express.Router();

async function handleCoverageIVR(request) {
  console.log("handleCoverageIVR: Request received", request.url);
  
  // Retrieve the coverageId from the query string.
  const coverageId = request.nextUrl.searchParams.get('coverageId');
  console.log("Coverage ID:", coverageId);
  
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  
  // Set a default prompt.
  let promptText = "Please say yes to confirm or no to deny covering the shift.";

  try {
    const client = await pool.connect();
    try {
      // Query directly from schedules.
      const queryText = `
        SELECT 
          covered_for, 
          to_char(shift_date, 'YYYY-MM-DD') as shift_date, 
          start_time, 
          end_time 
        FROM schedules 
        WHERE id = $1
      `;
      const result = await client.query(queryText, [coverageId]);
      if (result.rowCount > 0) {
        const { covered_for, shift_date, start_time, end_time } = result.rows[0];
        promptText = `You are being asked to cover for ${covered_for} on ${shift_date} from ${start_time} to ${end_time}. Please say yes to confirm or no to deny.`;
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching shift details:", err);
    // If an error occurs, the default promptText is used.
  }

  // Create a Gather that waits for speech input.
  // Note the action URL now includes "/api" so that it routes correctly.
  const gather = twiml.gather({
    input: 'speech',
    timeout: 5,
    speechTimeout: 'auto',
    action: `/api/twilio/coverage-handle-speech?coverageId=${coverageId}`,
    method: 'POST'
  });
  
  gather.say(promptText, { voice: "alice" });
  twiml.say("We did not receive your response. Goodbye.", { voice: "alice" });

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" }
  });
}

router.get('/twilio/coverage-ivr', async (req, res) => {
  const { coverageId } = req.query;
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  // Default prompt if no details found.
  let promptText = "Please say yes to confirm or no to deny covering the shift.";

  try {
    const client = await pool.connect();
    try {
      // Adjust this query as needed.
      // For example, if your coverage record relates to a schedule record,
      // you might join the tables to fetch shift details.
      const queryText = `
        SELECT 
          s.covered_for, 
          to_char(s.shift_date, 'YYYY-MM-DD') as shift_date, 
          s.start_time, s.end_time 
        FROM schedules s
        JOIN coverage c ON s.id = c.schedule_id
        WHERE c.id = $1
      `;
      const result = await client.query(queryText, [coverageId]);
      if (result.rowCount > 0) {
        const { covered_for, shift_date, start_time, end_time } = result.rows[0];
        promptText = `You are being asked to cover for ${covered_for} on ${shift_date} from ${start_time} to ${end_time}. Please say yes to confirm or no to deny.`;
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching shift details:", err);
    // If an error occurs then the default promptText will be used.
  }

  // Set up Gather so Twilio waits for speech input.
  const gather = twiml.gather({
    input: 'speech',
    action: `/twilio/coverage-handle-speech?coverageId=${coverageId}`,
    method: 'POST',
    timeout: 5,
    speechTimeout: 'auto'
  });
  gather.say(promptText, { voice: "alice" });
  // Fallback if no input is captured.
  twiml.say("We did not receive your response. Goodbye.", { voice: "alice" });

  res.type('text/xml');
  res.send(twiml.toString());
});

router.post('/twilio/coverage-handle-speech', async (req, res) => {
  const { coverageId } = req.query;
  // Ensure your Express app is using body-parser or express.urlencoded middleware.
  let speechResult = req.body.SpeechResult || "";
  speechResult = speechResult.trim().toLowerCase();
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  try {
    const client = await pool.connect();
    try {
      if (speechResult.includes('yes')) {
        // Update shift status to 'confirmed'
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
      } else if (speechResult.includes('no')) {
        // Update shift status to 'denied' (or leave it unchanged as appropriate)
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

  res.type('text/xml');
  res.send(twiml.toString());
});

export async function GET(request) {
  const url = new URL(request.url);
  const coverageId = url.searchParams.get('coverageId');
  const attempt = url.searchParams.get('attempt') ? parseInt(url.searchParams.get('attempt')) : 1;
  console.log(`Coverage IVR: Attempt ${attempt} for coverageId ${coverageId}`);

  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  // Default prompt text if no details are available.
  let promptText = "Please say yes to confirm or no to deny covering the shift.";
  try {
    const client = await pool.connect();
    try {
      // Fetch shift details and the employee's first name.
      const queryText = `
        SELECT s.covered_for,
               to_char(s.shift_date, 'YYYY-MM-DD') AS shift_date,
               s.start_time,
               s.end_time,
               e.first_name
        FROM schedules s
        JOIN employees e ON s.employee_id = e.id
        WHERE s.id = $1
      `;
      const result = await client.query(queryText, [coverageId]);
      if (result.rowCount > 0) {
        const { covered_for, shift_date, start_time, end_time, first_name } = result.rows[0];
        promptText = `Hello ${first_name}, this is the Restaurant Coverage Team calling. You are being asked to cover for ${covered_for} on ${shift_date} from ${start_time} to ${end_time}. Please say yes to confirm or no to deny.`;
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching schedule details:", err);
  }

  // Set up a <Gather> to listen for speech input.
  const gather = twiml.gather({
    input: 'speech',
    action: `/api/twilio/coverage-handle-speech?coverageId=${coverageId}&attempt=${attempt}`,
    method: 'POST',
    timeout: 5,
    speechTimeout: 'auto'
  });
  gather.say(promptText, { voice: "alice" });

  // If no speech is captured, re-prompt up to three attempts before ending the call.
  if (attempt < 3) {
    // Redirect using GET to the same endpoint with an incremented attempt count.
    twiml.redirect({ method: 'GET' }, `/api/twilio/coverage-ivr?coverageId=${coverageId}&attempt=${attempt + 1}`);
  } else {
    twiml.say("We did not receive your response after multiple attempts. Goodbye.", { voice: "alice" });
  }

  // Return the TwiML response with the proper XML content type.
  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" }
  });
}

// Add a POST export so that Twilio's POST requests are handled.
export async function POST(request) {
  return GET(request);
}