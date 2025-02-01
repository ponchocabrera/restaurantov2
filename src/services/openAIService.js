// services/openAIService.js

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateOpenAIPrompt(menuData, researchData, config) {
  const { pageCount, paperSize, primaryColor, secondaryColor, style } = config;
  
  const systemPrompt = `You are MenuGPT, an advanced AI menu design system. 
Generate SPECIFIC and DETAILED recommendations for each section:

DESIGN OVERVIEW
Provide a detailed design approach for a ${style} ${pageCount}-page menu, including:
- Overall aesthetic direction
- Visual hierarchy strategy
- Space utilization approach
- Texture and pattern recommendations

COLOR SCHEME
Brand Colors:
- Primary: ${primaryColor || '#000000'} 
- Secondary: ${secondaryColor || '#666666'}
Required Color Details:
- Background color for menu pages
- Background colors for sections
- Accent colors (provide exact hex codes):
  * Highlight color for best sellers
  * Border colors for sections
  * Background colors for item cards
- Texture specifications:
  * Pattern types for backgrounds
  * Opacity levels for overlays
  * Gradient definitions if applicable

LAYOUT STRUCTURE
Pages: ${pageCount}
Size: ${paperSize}
Provide specific details for:
- Background patterns and textures per section
- Section divider styles and colors
- Card/container background colors
- Shadow specifications
- Border styles and colors

DESIGN RECOMMENDATIONS
1. Specific typography choices (fonts, sizes, weights)
2. Exact spacing measurements
3. Visual hierarchy implementation
4. Category organization strategy`;

  const { menuItems, itemsAnalysis } = menuData;
  
  const userPrompt = `ANALYZING MENU STRUCTURE...

MENU COMPOSITION:
${menuItems.map(item => `[ITEM] ${item.name} (${item.category})
- Price: ${typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : `$${item.price}`}
- Description: ${item.description || 'No description available'}
- Sales Performance: ${item.sales_performance || 'standard'}
- Margin Level: ${item.margin_level || 'standard'}
- Boost Desired: ${item.boost_desired ? 'Yes' : 'No'}`).join('\n')}

PERFORMANCE METRICS:
- Best Sellers: ${itemsAnalysis.bestSellers.map(item => item.name).join(', ')}
- High Margin: ${itemsAnalysis.highMargin.map(item => item.name).join(', ')}
- Priority Items: ${itemsAnalysis.boostedItems.map(item => item.name).join(', ')}

Based on this data and menu psychology research, provide detailed recommendations for:
1. Item-specific placement and highlighting strategies
2. Visual hierarchy optimization
3. Psychological pricing strategies
4. Category organization
5. Custom styling requirements for each item type`;

  return { systemPrompt, userPrompt };
}

module.exports = {
  generateOpenAIPrompt
};