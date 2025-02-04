import OpenAI from 'openai';
import { generateDesignRecommendations } from '@/utils/researchProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AI_MODELS = {
  MENU_GENERATION: 'ft:gpt-3.5-turbo-0125:restaurantos:restaurantos:AwLDI561',
  MENU_FALLBACK: 'gpt-4o-mini',
  DESCRIPTION_ENHANCEMENT: 'gpt-3.5-turbo-0125'
};

export const AI_CONFIG = {
  temperature: 0.7,
  max_tokens: 4000
};

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

export async function generateMenuHTML(prompt, menuData, config) {
  const dimensions = getPageDimensions(config.paperSize);
  
  const itemsAnalysis = menuData.itemsAnalysis || {
    bestSellers: [],
    highMargin: [],
    boostedItems: []
  };
  
  const designRecs = generateDesignRecommendations(config.style, itemsAnalysis);
  
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODELS.MENU_GENERATION,
      messages: [
        { 
          role: 'system', 
          content: `You are a specialized AI that outputs creative, professional HTML/CSS for restaurant menus. Your response MUST follow this structure:

<style>
  /* Required base styles */
  @media print {
    @page { size: [paperSize]; margin: 0; }
    body { margin: 0; padding: 0; }
  }
  .menu-container {
    width: 100%;
    max-width: [dimensions];
    margin: 0 auto;
    padding: 0;
  }
  /* Add your creative styles here */
</style>

<div class="menu-container">
  <!-- Your creative menu structure here -->
</div>

While following the provided color scheme and typography guidelines, you have complete creative freedom to:
1. Design unique and beautiful layouts
2. Create custom decorative elements and patterns
3. Implement creative dividers and section transitions
4. Add subtle textures and visual flourishes
5. Design elegant item cards and containers

Remember: The style block is REQUIRED and must come before the HTML structure.`
        },
        { 
          role: 'user', 
          content: `Create a ${config.style} menu page with these items:
${menuData.menuItems.map(item => `
- ${item.name} ($${item.price})
  ${item.description || 'No description'}
  ${item.sales_performance === 'best_seller' ? '(Best Seller)' : ''}
  ${item.margin_level === 'high_margin' ? '(High Margin)' : ''}
  ${item.boost_desired ? '(Featured)' : ''}`).join('\n')}

Style requirements:
- Background: Use ${config.style === 'modern' ? 'subtle textures' : config.style === 'classic' ? 'elegant patterns' : 'warm textures'}
- Colors: Primary ${config.primaryColor}, Secondary ${config.secondaryColor}
- Paper: ${config.paperSize} (${dimensions.width} x ${dimensions.height})

Design recommendations:
${designRecs.map(rec => `- ${rec}`).join('\n')}`
        }
      ],
      ...AI_CONFIG
    });

    let generatedHTML = completion.choices[0].message.content
      .replace(/```html\n?([\s\S]*?)\n?```/g, '$1')
      .replace(/```HTML\n?([\s\S]*?)\n?```/g, '$1')
      .trim();

    // Ensure menu-container class exists
    if (!generatedHTML.includes('class="menu-container"') && !generatedHTML.includes("class='menu-container'")) {
      generatedHTML = `<div class="menu-container">${generatedHTML}</div>`;
    }

    // Validate the generated HTML
    const validation = validateMenuItems(generatedHTML, menuData.menuItems);
    if (!validation.isValid) {
      throw new Error(`Menu validation failed: ${validation.errors.join(', ')}`);
    }

    return generatedHTML;
  } catch (error) {
    if (error.code === 'model_not_available') {
      console.warn('Fine-tuned model not available, falling back to GPT-4');
      return generateFallbackHTML(prompt, menuData, config);
    }
    throw error;
  }
}

async function generateFallbackHTML(prompt, menuData, config) {
  const completion = await openai.chat.completions.create({
    model: AI_MODELS.MENU_FALLBACK,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    ...AI_CONFIG
  });
  
  return completion.choices[0].message.content
    .replace(/```html\n?([\s\S]*?)\n?```/g, '$1')
    .replace(/```HTML\n?([\s\S]*?)\n?```/g, '$1')
    .trim();
}

function validateMenuItems(html, menuItems) {
  const errors = [];
  const lowerHTML = html.toLowerCase();

  menuItems.forEach(item => {
    // Skip validation for items named "test"
    if (item.name.toLowerCase() === 'test') {
      return;
    }

    // Check for item name presence
    if (!lowerHTML.includes(item.name.toLowerCase())) {
      errors.push(`Missing item: ${item.name}`);
    }

    // Only check description if it exists and isn't empty
    if (item.description && item.description.trim() !== '') {
      const descriptionLower = item.description.toLowerCase();
      const descriptionWords = descriptionLower.split(' ').filter(word => word.length > 3);
      const hasDescription = descriptionWords.some(word => lowerHTML.includes(word));
      
      if (!hasDescription) {
        errors.push(`Missing description for: ${item.name}`);
      }
    }

    // More flexible price checking
    if (item.price) {
      const priceStr = typeof item.price === 'number' ? 
        item.price.toString() : 
        item.price.toString().replace('$', '');
      
      // Try different price formats
      const priceFormats = [
        priceStr,
        priceStr.replace('.', ','),
        parseFloat(priceStr).toFixed(2),
        parseFloat(priceStr).toString()
      ];
      
      const hasPriceMatch = priceFormats.some(format => html.includes(format));
      if (!hasPriceMatch) {
        errors.push(`Missing price for: ${item.name}`);
      }
    }
  });

  // Basic structure validation
  if (!html.includes('<style')) {
    errors.push('Missing <style> block');
  }
  if (!html.includes('class="menu-container"')) {
    errors.push('Missing menu-container class');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 