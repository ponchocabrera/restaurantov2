import OpenAI from 'openai';
import { generateDesignRecommendations } from '@/utils/researchProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeMenu(data, type) {
  // First phase: Extract menu information
  const menuData = await extractMenuData(data, type);
  
  // Second phase: Generate recommendations
  const recommendations = await generateRecommendations(menuData);
  
  return {
    menuData,
    recommendations
  };
}

async function extractMenuData(data, type) {
  if (type === 'image') {
    return await analyzeMenuImage(data);
  } else {
    return await analyzeMenuText(data);
  }
}

async function analyzeMenuImage(imageBase64) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "system",
        content: `You are a menu design expert. Analyze the menu and provide a detailed analysis in these EXACT sections:

STRUCTURE:
- Analyze menu sections, categories, and organization
- Evaluate information hierarchy and flow

DESIGN:
- Analyze typography, layout, and visual hierarchy
- Evaluate white space and composition

PRICING:
- Analyze price presentation and formatting
- Evaluate pricing strategy and psychology

COLOR:
- Analyze color scheme and contrast
- Evaluate brand color usage

VISUAL ELEMENTS:
- Analyze images, icons, and decorative elements
- Evaluate visual hierarchy

PSYCHOLOGY:
- Analyze decision triggers and customer journey
- Evaluate psychological elements

Format each section with bullet points starting with "-" and provide specific, detailed observations.`
      },
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: "Analyze this menu image following the specified sections exactly." 
          },
          {
            type: "image_url",
            image_url: { url: imageBase64 }
          }
        ]
      }
    ],
    max_tokens: 4096
  });

  const analysisText = response.choices[0].message.content;
  
  return {
    raw: analysisText
  };
}

function extractSection(text, sectionName) {
  const sectionRegex = new RegExp(`${sectionName}:[\\s\\S]*?(?=\\n\\n[A-Z]+:|$)`);
  const match = text.match(sectionRegex);
  
  if (!match) return [];
  
  // Get only the content specific to this section
  const sectionContent = match[0]
    .replace(`${sectionName}:`, '')
    .trim();
    
  // Split by bullet points and clean up
  const items = sectionContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('•'))
    .map(line => line.substring(1).trim())
    .filter(line => line.length > 0);

  // Only return the first comprehensive analysis block
  const firstBlock = [];
  let foundBreak = false;

  for (const item of items) {
    // If we find a repeated pattern or a summary-like statement, stop
    if (foundBreak) break;
    
    // Check for repeated patterns or summary statements
    if (firstBlock.some(existing => 
      item.toLowerCase().includes(existing.toLowerCase()) ||
      existing.toLowerCase().includes(item.toLowerCase())
    )) {
      foundBreak = true;
      continue;
    }
    
    firstBlock.push(item);
  }

  return firstBlock;
}

async function analyzeMenuText(text) {
  // Implementation of analyzeMenuText function
} 