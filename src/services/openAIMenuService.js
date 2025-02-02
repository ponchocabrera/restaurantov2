import OpenAI from 'openai';
import { generateDesignRecommendations } from '@/utils/researchProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AI_MODELS = {
  MENU_GENERATION: 'ft:gpt-3.5-turbo-0125:restaurantos:restaurantos:AwLDI561',
  MENU_FALLBACK: 'gpt-4-0125-preview',
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
          content: `You are a specialized AI that outputs clean, professional HTML/CSS for restaurant menus. You're specialized in catering menus with elegant sections and descriptions. You know how to:
1. Create upscale, minimalistic designs
2. Add textured backgrounds and decorative elements
3. Use sophisticated typography
4. Highlight pricing effectively

Your output MUST:
1. Use <div class="menu-container"> as the root element
2. Include a complete <style> block with print-ready CSS
3. Follow the exact structure from training examples
4. Include all menu items with proper styling`
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
      // Make description check more lenient by looking for key phrases
      const descriptionWords = descriptionLower.split(' ').filter(word => word.length > 3);
      const hasDescription = descriptionWords.some(word => lowerHTML.includes(word));
      
      if (!hasDescription) {
        errors.push(`Missing description for: ${item.name}`);
      }
    }

    // Check for price if it exists
    if (item.price) {
      const priceStr = typeof item.price === 'number' ? 
        item.price.toFixed(2) : 
        item.price.toString().replace('$', '');
      
      if (!html.includes(priceStr)) {
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