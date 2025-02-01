import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const getPageDimensions = (paperSize) => {
  switch(paperSize) {
    case 'letter':
      return { width: '8.5in', height: '11in' };
    case 'a4':
      return { width: '210mm', height: '297mm' };
    case 'legal':
      return { width: '8.5in', height: '14in' };
    default:
      return { width: '8.5in', height: '11in' }; // Default to letter
  }
};

/**
 * Validate that the generated HTML meets the expected structure:
 * - Contains the main container and style block.
 * - Contains each required (non-empty) category exactly once.
 * - Contains EXACTLY the number of menu page blocks specified.
 */
async function validateClaudeResponse(html, menuData, config) {
  // Basic structure checks.
  const structureChecks = [
    { check: html.includes('menu-container'), error: 'Missing menu container' },
    { check: html.includes('<style>'), error: 'Missing style block' },
  ];

  // Extract non-empty categories from the menu items.
  const categories = [
    ...new Set(
      menuData.menuItems
        .map(item => item.category)
        .filter(category => category && category.trim().length > 0)
    )
  ];

  // Verify that each category appears exactly once (using the section header).
  const categoryChecks = categories.map(category => {
    // This regex looks for a header with the category name.
    const regex = new RegExp(`<h2\\s+class="section-title">\\s*${category}\\s*<\\/h2>`, 'gi');
    const matches = html.match(regex) || [];
    return {
      check: matches.length === 1,
      error: `Category "${category}" should appear exactly once, but appears ${matches.length} times`
    };
  });

  // Check for the exact number of page blocks.
  const pageCount = config.pageCount || 1;
  const pageMatches = html.match(/<div class="menu-page">/g) || [];
  const pageChecks = [{
    check: pageMatches.length === pageCount,
    error: `Invalid page count. Expected ${pageCount}, got ${pageMatches.length}`,
  }];

  const allChecks = [...structureChecks, ...pageChecks, ...categoryChecks];
  const failures = allChecks.filter(check => !check.check);

  return {
    isValid: failures.length === 0,
    errors: failures.map(f => f.error)
  };
}

/**
 * Generate HTML for the menu using Anthropic Claude.
 * This version includes extra design sections (Design Overview and Layout Planning)
 * along with the menu structure, and explicitly instructs Claude to output exactly the required
 * number of <div class="menu-page"> elements with no extras.
 */
async function generateClaudeHTML(prompt, menuData, config, maxRetries = 2) {
  const pageCount = config.pageCount || 1;
  const dimensions = getPageDimensions(config.paperSize);
  
  const systemMessage = `You are an expert menu designer tasked with creating a beautiful, professional restaurant menu that adheres to specific requirements. Before we begin, here are the key parameters for your design:

Number of pages to create:
<page_count>
${pageCount}
</page_count>

Page dimensions:
<dimensions>
${dimensions.width} x ${dimensions.height}
</dimensions>

Paper size for printing:
<paper_size>
${config.paperSize}
</paper_size>

Design recommendations to inspire your creativity:
<design_recommendations>
${prompt}
</design_recommendations>

Menu Item Structure:
Each menu item should be formatted as:
<div class="menu-item">
  <div class="item-details">
    <h3 class="item-name">[Item Name]</h3>
    <p class="item-description">[Item Description]</p>
  </div>
  <div class="price-container">
    <span class="price">[Price]</span>
  </div>
</div>

Here's the menu data to include:
${menuData.menuItems.map(item => `
- Name: ${item.name}
- Category: ${item.category}
- Price: ${typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : `$${item.price}`}
- Description: ${item.description || 'No description available'}
`).join('\n')}

Image Assets Available:
${config.images ? Object.entries(config.images).map(([name, url]) => 
  `- ${name}: ${url}`
).join('\n') : 'No images provided'}

Base CSS for menu items:
\`\`\`css
.menu-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1em;
  align-items: start;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: bold;
  margin: 0;
}

.item-description {
  color: #666;
  font-size: 0.9em;
  margin: 0.2em 0;
}

.price-container {
  margin-left: 1em;
}

.price {
  font-weight: bold;
  white-space: nowrap;
}
\`\`\`

Now, let's proceed with the detailed instructions for creating the menu:

1. HTML Structure:
   \`\`\`html
   <div class="menu-container">
     <style>
       /* Base styles will go here */
     </style>

     <div class="menu-page">
       <!-- First page content -->
     </div>
     <!-- Additional pages as needed -->
   </div>
   \`\`\`

2. CSS Requirements:
   - Include the following base styles within the <style> tag:
     \`\`\`css
     .menu-container { 
       width: 100%;
       max-width: ${dimensions.width};
       margin: 0 auto;
     }
     .menu-page { 
       width: ${dimensions.width};
       height: ${dimensions.height};
       margin: 0 auto;
       padding: 1in;
       page-break-after: always;
       position: relative;
     }
     .menu-page:last-child {
       page-break-after: auto;
     }
     @media print {
       .menu-page {
         margin: 0;
         padding: 1in;
       }
       @page {
         size: ${config.paperSize};
         margin: 0;
       }
     }
     \`\`\`
   - Add your creative styles to enhance the design.

3. Page Count and Structure:
   - Create exactly ${pageCount} pages.
   - Wrap each page in \`<div class="menu-page"></div>\`.
   - Ensure each page is complete and self-contained.

4. Content Requirements:
   - Include all menu items.
   - Keep categories together (don't split across pages).
   - Each category must appear exactly once.

5. Design Elements:
   - Create beautiful category headers.
   - Use modern CSS features for enhanced design.
   - Implement creative typography and spacing.

6. Technical Considerations:
   - Ensure proper page breaks for printing.
   - Configure print layout correctly.
   - Make sure all content fits within the specified number of pages.

Before generating the final HTML/CSS, wrap your menu planning process in <menu_planning> tags. In this section:
1. List out each category of menu items and estimate how many items will be in each category.
2. Sketch out a rough layout for each page, including where category headers and menu items will be placed.
3. Brainstorm some creative design elements based on the design recommendations.
4. Consider how to distribute the content across the specified number of pages.

It's OK for this section to be quite long. Then, create the complete, production-ready HTML with embedded CSS that results in a beautiful menu.

Final Verification:
Before submitting your response, verify that:
1. You have created exactly ${pageCount} \`<div class="menu-page">\` elements.
2. All content fits within these pages.
3. The print layout is properly configured.
4. Your design adheres to all specified requirements while being creative and visually appealing.`;

  // Replace the validation object with validateResponse function
  const validateResponse = (html) => {
    const pageMatches = html.match(/<div[^>]*class="[^"]*menu-page[^"]*"[^>]*>/g) || [];
    const categories = [
      ...new Set(
        menuData.menuItems
          .map(item => item.category)
          .filter(category => category && category.trim().length > 0)
      )
    ];

    const errors = [];
    
    // Check page count
    if (pageMatches.length !== pageCount) {
      errors.push(`Expected ${pageCount} pages, got ${pageMatches.length}`);
    }

    // Check categories
    categories.forEach(category => {
      const regex = new RegExp(`<h2[^>]*>\\s*${category}\\s*<\\/h2>`, 'gi');
      const matches = html.match(regex) || [];
      if (matches.length !== 1) {
        errors.push(`Category "${category}" should appear exactly once, but appears ${matches.length} times`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  let attempts = 0;
  let lastError = null;
  
  while (attempts < maxRetries) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 90000);
      });

      const responsePromise = anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 2048,
        temperature: 0.3,
        system: systemMessage,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);
      const htmlContent = response.content[0].text;
      const cleanHTML = htmlContent.replace(/```html\n?|\n?```/g, '').trim();

      const validationResult = validateResponse(cleanHTML);
      if (validationResult.isValid) {
        return cleanHTML;
      }
      
      attempts++;
      lastError = validationResult.errors.join(', ');
      
    } catch (error) {
      console.error(`Claude API Error (attempt ${attempts + 1}):`, error);
      lastError = error.message;
      attempts++;
    }
  }

  throw new Error(`Failed to generate valid menu HTML after ${maxRetries} attempts. Last error: ${lastError}`);
}

module.exports = {
  generateClaudeHTML
};
