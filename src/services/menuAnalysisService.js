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
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a menu design expert. Extract and analyze all menu details."
      },
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: "Analyze this menu image and extract all relevant information including items, prices, descriptions, layout, typography, and design elements."
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
  
  return response.choices[0].message.content;
} 