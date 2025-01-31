// app/api/ai/generatePrompt/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateOpenAIPrompt } from '@/services/openAIService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function loadResearchData() {
  // For now, return static research data
  // You can later move this to a database or external file
  return {
    psychology_factors: [
      { description: "Place high-margin items in the golden triangle", effectiveness: 0.85 },
      { description: "Use visual anchors for premium items", effectiveness: 0.75 },
      { description: "Remove currency symbols to reduce price sensitivity", effectiveness: 0.65 }
    ]
  };
}

export async function POST(request) {
  console.log('API route handler started');
  try {
    const body = await request.json();
    console.log('Received request body:', body);
    
    const { menuItems, config, itemsAnalysis } = body;
    
    const { systemPrompt, userPrompt } = await generateOpenAIPrompt(
      { menuItems, itemsAnalysis },
      null,
      config
    );

    console.log('Generated prompts, calling OpenAI...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0].message.content;
    console.log('Received AI response');
    
    // Extract colors from the natural language response
    const colorRegex = {
      primary: /Primary:\s*(.*?)\s*-/i,
      secondary: /Secondary:\s*(.*?)\s*-/i
    };

    // Convert color names to hex
    const colorMap = {
      'slate gray': '#708090',
      'mustard yellow': '#FFDB58',
      // Add more color mappings as needed
    };

    const primaryMatch = aiResponse.match(colorRegex.primary);
    const secondaryMatch = aiResponse.match(colorRegex.secondary);

    const primaryColor = primaryMatch ? 
      (colorMap[primaryMatch[1].toLowerCase()] || '#000000') : 
      '#000000';

    const secondaryColor = secondaryMatch ? 
      (colorMap[secondaryMatch[1].toLowerCase()] || '#666666') : 
      '#666666';

    return NextResponse.json({
      suggestions: {
        content: aiResponse,
        pageCount: 1,
        primaryColor,
        secondaryColor
      },
      prompt: aiResponse
    });
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate menu suggestions: ' + error.message },
      { status: 500 }
    );
  }
}