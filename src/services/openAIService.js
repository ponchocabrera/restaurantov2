// services/openAIService.js

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateOpenAIPrompt(menuData, researchData, config) {
  const systemPrompt = `You are MenuGPT, an advanced AI menu design system. 
Analyze the menu data and provide specific recommendations in the following format:

DESIGN OVERVIEW
[Provide a brief overview of the recommended design approach]

COLOR SCHEME
Primary: [use specific color name like 'Slate Gray', 'Navy Blue', etc.] - [brief explanation]
Secondary: [use specific color name like 'Mustard Yellow', 'Burgundy', etc.] - [brief explanation]

LAYOUT STRUCTURE
- [Key layout recommendations]
- [Spacing and organization details]

DESIGN RECOMMENDATIONS
1. [First recommendation]
2. [Second recommendation]
3. [Third recommendation]

Use clear, specific color names that can be easily translated to hex values.`;

  const { menuItems, itemsAnalysis } = menuData;
  const { style } = config;

  const userPrompt = `ANALYZING MENU STRUCTURE...

MENU COMPOSITION:
${menuItems.map(item => `[ITEM] ${item.name} (${item.category})`).join('\n')}

PERFORMANCE METRICS:
- Best Sellers: ${itemsAnalysis.bestSellers.length} items
- High Margin: ${itemsAnalysis.highMargin.length} items
- Priority Items: ${itemsAnalysis.boostedItems.length} items

STYLE PREFERENCE: ${style}

Based on this data and menu psychology research, provide recommendations that:
1. Define an optimal layout structure
2. Suggest a cohesive color palette
3. Outline category organization
4. Establish visual hierarchy

Format your response using the structure defined above, focusing on clear, natural language descriptions.`;

  return { systemPrompt, userPrompt };
}

module.exports = {
  generateOpenAIPrompt
};