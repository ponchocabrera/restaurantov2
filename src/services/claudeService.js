// services/claudeService.js

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

async function generateClaudeHTML(prompt, menuData, config) {
  const systemPrompt = `You are an expert menu designer who creates beautiful, semantic HTML and CSS.
Your task is to convert a menu design prompt into clean, professional HTML/CSS that follows these STRICT requirements:

LAYOUT STRUCTURE:
1. Each menu section must have clear visual hierarchy
2. Items should be arranged in a clean, readable grid or list
3. Prices should be right-aligned and clearly visible
4. Descriptions should be in a lighter, smaller font
5. Best sellers and high-margin items must have subtle highlighting
6. Categories must have clear visual separation

PSYCHOLOGICAL ELEMENTS:
1. Limited items per section (5-7 max)
2. Visual cues for premium items
3. "Chef's Recommendations" and "Customer Favorites" badges
4. Strategic placement of high-margin items
5. Clear typography hierarchy for easy scanning

TECHNICAL REQUIREMENTS:
1. Use semantic HTML5 elements
2. Include ALL styles in a <style> tag
3. Implement print-ready CSS
4. Follow the specified class naming convention
5. Ensure responsive design principles
6. Use the provided color scheme and style guidelines

Generate HTML/CSS that precisely matches these requirements while incorporating the specific design prompt details.`;

  const userPrompt = `Based on this prompt and data, generate a complete HTML/CSS menu design:

Design Prompt:
${prompt}

Configuration:
${JSON.stringify(config, null, 2)}

Menu Items:
${JSON.stringify(menuData.menuItems, null, 2)}

Requirements:
- Use semantic HTML5 elements
- Include ALL styles in a <style> tag within the HTML
- Do not reference any external stylesheets or resources
- Implement proper spacing and typography
- Create a visually balanced layout
- Style best-sellers and high-margin items appropriately
- Ensure the design works for the specified paper size
- Use the following class structure:
  * menu-container (root element)
  * menu-section (category sections)
  * menu-item (individual items)
  * menu-item-title (item names)
  * menu-item-description (item descriptions)
  * menu-item-price (prices)`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `${systemPrompt}\n\n${userPrompt}`
      }]
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
  }
}

module.exports = {
  generateClaudeHTML
};