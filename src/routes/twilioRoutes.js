require('dotenv').config();
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const twilio = require('twilio');

// Setup middleware to parse URL-encoded and JSON bodies.
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// Initialize a Postgres connection pool using environment variables.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Initialize the Twilio client.
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

/**
 * Function: callEmployeeForCoverage
 *  - Looks up the employee phone number via the coverage record,
 *  - Initiates an outbound call using Twilio to the employee's phone.
 *  - The call directs Twilio to our IVR endpoint with the coverageId as a query parameter.
 */
async function callEmployeeForCoverage(coverageId) {
  try {
    const client = await pool.connect();
    try {
      const queryText = `
        SELECT c.employee_id, e.phone 
        FROM coverage c
        JOIN employees e ON c.employee_id = e.id
        WHERE c.id = $1
      `;
      const result = await client.query(queryText, [coverageId]);
      if (result.rowCount === 0) {
        console.error(`No coverage record found for id: ${coverageId}`);
        return;
      }
      const { phone } = result.rows[0];

      // Initiate the outbound call.
      const call = await twilioClient.calls.create({
        to: phone,
        from: process.env.TWILIO_CALLER_ID,
        url: `${process.env.TWILIO_BASE_URL}/twilio/coverage-ivr?coverageId=${coverageId}`
      });
      console.log("Twilio call initiated. Call SID:", call.sid);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error in callEmployeeForCoverage:", err);
  }
}

/**
 * PUT /coverage/:id/pending
 *  - Updates the coverage record to 'pending'.
 *  - Waits for a delay (default 5 minutes, configurable via CALL_DELAY_MS) then
 *    triggers a call to the employee.
 */
router.put('/coverage/:id/pending', async (req, res) => {
  const coverageId = req.params.id;
  try {
    const client = await pool.connect();
    try {
      const updateText = `
        UPDATE coverage SET coverage_status = 'pending'
        WHERE id = $1 RETURNING *
      `;
      const updateResult = await client.query(updateText, [coverageId]);
      if (updateResult.rowCount === 0) {
        res.status(404).json({ error: "Coverage record not found" });
        return;
      }
      res.json({ message: "Coverage status updated to pending" });

      // Delay header call (default 5 minutes).
      const delayMs = process.env.CALL_DELAY_MS ? parseInt(process.env.CALL_DELAY_MS) : 10000;
      setTimeout(() => {
        callEmployeeForCoverage(coverageId);
      }, delayMs);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating coverage record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Function to build the dynamic prompt text.
async function getPromptText(coverageId) {
  let promptText = "Please say yes to confirm or no to deny covering the shift.";
  try {
    const client = await pool.connect();
    try {
      // Join employees table to fetch first name for a friendly greeting.
      const queryText = `
        SELECT 
          s.covered_for, 
          to_char(s.shift_date, 'YYYY-MM-DD') as shift_date, 
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
    // On error, use the default prompt.
  }
  return promptText;
}

// Unified handler for GET and POST requests.
async function handleCoverageIVR(req, res) {
  const { coverageId } = req.query;
  // Use the attempt parameter if present, default to 1.
  const currentAttempt = req.query.attempt ? parseInt(req.query.attempt, 10) : 1;
  console.log(`Coverage IVR: Attempt ${currentAttempt} for coverageId ${coverageId}`);

  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  // Get our prompt text (using DB details if available).
  const promptText = await getPromptText(coverageId);

  // Set up <Gather> so the caller can speak.
  // (Notice we include the attempt count in the action URL.)
  const gather = twiml.gather({
    input: 'speech',
    action: `/twilio/coverage-handle-speech?coverageId=${coverageId}&attempt=${currentAttempt}`,
    method: 'POST',
    timeout: 5,
    speechTimeout: 'auto'
  });
  gather.say(promptText, { voice: "alice" });

  // If no speech is detected, check attempt count.
  if (currentAttempt < 3) {
    // Re-prompt by redirecting to this same route with an incremented attempt.
    // We explicitly set method "GET" so that if Twilio respects it, the GET route will be used.
    twiml.redirect({ method: 'GET' }, `/twilio/coverage-ivr?coverageId=${coverageId}&attempt=${currentAttempt + 1}`);
  } else {
    twiml.say("We did not receive your response after multiple attempts. Goodbye.", { voice: "alice" });
  }

  res.type('text/xml');
  res.send(twiml.toString());
}

// GET route for the IVR.
router.get('/twilio/coverage-ivr', async (req, res) => {
  return handleCoverageIVR(req, res);
});

// POST route for the IVR.
// (This ensures that if Twilio happens to call POST with an attempt parameter, it is handled.)
router.post('/twilio/coverage-ivr', async (req, res) => {
  return handleCoverageIVR(req, res);
});

module.exports = router; 