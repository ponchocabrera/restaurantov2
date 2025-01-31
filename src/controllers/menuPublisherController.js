// menuPublisherController.js

const { getMenuItems } = require('../db/menuItemModel');
const { generateOpenAIPrompt } = require('../services/openAIService');
const { generateClaudeHTML } = require('../services/claudeService');
const { createPDF } = require('../services/pdfService');
const { processResearch } = require('../utils/researchProcessor');

// Instead of expecting an Express `req, res`, let's just receive data
async function publishMenu({ menuType, pages, size, userPrompt }) {
  try {
    // 1. Fetch items, research, etc.
    const menuItems = await getMenuItems();
    const researchText = await processResearch();

    const prompt = `
      Combine the following data...
      ...
    `;

    // 2. OpenAI and Claude calls
    const openAIResponse = await generateOpenAIPrompt(prompt);
    const generatedHTML = await generateClaudeHTML(openAIResponse);
    // const pdfBuffer = await createPDF(generatedHTML);

    // 3. Return an object that Next.js route can pass back as JSON
    return {
      success: true,
      openAIResponse,
      generatedHTML,
      // pdf: pdfBuffer.toString('base64'),
    };
  } catch (err) {
    console.error('[publishMenu] Error:', err);
    // Return an error object
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = { publishMenu };
