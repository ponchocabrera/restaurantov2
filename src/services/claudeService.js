import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

function getPageDimensions(paperSize) {
  switch (paperSize) {
    case 'letter':
      return { width: '8.5in', height: '11in' };
    case 'a4':
      return { width: '210mm', height: '297mm' };
    case 'legal':
      return { width: '8.5in', height: '14in' };
    default:
      return { width: '8.5in', height: '11in' };
  }
}

/**
 * A simple validator that checks:
 * 1. All items appear in the generated HTML by name.
 * 2. A <style> block is present for printing.
 */
function validateResponse(html, menuItems) {
  const errors = [];

  if (!html.includes('<style>')) {
    errors.push('Missing <style> block in output.');
  }

  menuItems.forEach((item) => {
    if (!html.toLowerCase().includes(item.name.toLowerCase())) {
      errors.push(`Item name "${item.name}" not found in HTML.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function generateClaudeHTML(prompt, menuData, config, maxRetries = 2) {
  const dimensions = getPageDimensions(config.paperSize);

  const systemMessage = `
You are a highly skilled AI menu designer. 
Requirements:
1. All items (name, description, and price) must appear in the final HTML.
2. The final layout must be suitable for printing on ${config.paperSize} size: ${dimensions.width} x ${dimensions.height}.
3. Use advanced, visually appealing design: color, background textures, modern CSS, etc.
4. Output the menu in a <div class="menu-container"> ... </div> structure.
5. Include a <style> block with CSS suitable for printing (page sizing, margins, etc.).

Base CSS suggestion:
<style>
  @media print {
    @page {
      size: ${config.paperSize};
      margin: 0;
    }
    body {
      margin: 0; 
      padding: 0;
    }
  }
  .menu-container {
    width: 100%;
    max-width: ${dimensions.width};
    margin: 0 auto;
    padding: 0;
    background: #fdfdfd;
  }
</style>

Be as creative as you like, but ensure that each item's name, description, and price is included.
`;

  let attempts = 0;
  let lastError = null;

  while (attempts < maxRetries) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 180000); // 3 minutes
      });

      const responsePromise = anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2048,
        temperature: 0.7,
        system: systemMessage,
        messages: [
          {
            role: 'user',
            content: `Please create an HTML menu that includes:
1. A complete <style> block with all CSS rules
2. A <div class="menu-container"> wrapper
3. All menu items with their exact names, descriptions, and prices
4. Proper semantic HTML structure

Here's the menu content to use:
${prompt}

Remember: The output must be valid HTML that includes all menu items and a style block.`
          },
        ],
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);
      const raw = response.content[0].text || '';
      const cleanHTML = raw
        .replace(/```html\n?([\s\S]*?)\n?```/g, '$1')
        .replace(/```HTML\n?([\s\S]*?)\n?```/g, '$1')
        .trim();

      return cleanHTML;
    } catch (error) {
      attempts++;
      lastError = error;
    }
  }

  throw new Error(`Failed to generate HTML after ${maxRetries} attempts. Last error: ${lastError}`);
}
