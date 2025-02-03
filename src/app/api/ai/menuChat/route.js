import OpenAI from 'openai';
import { MENU_RESEARCH } from '@/utils/researchProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    const { message, analysis, recommendations, chatHistory } = await request.json();
    
    // Construct the context from previous analysis
    const context = `
Previous Menu Analysis:
${analysis}

Generated Recommendations:
${JSON.stringify(recommendations, null, 2)}

Research Data:
${JSON.stringify(MENU_RESEARCH, null, 2)}
`;

    // Prepare chat messages
    const messages = [
      {
        role: "system",
        content: "You are a menu optimization expert. Use the provided analysis, recommendations, and research data to help users understand and implement menu improvements. Be specific and reference the analysis when answering questions."
      },
      {
        role: "user",
        content: `Context: ${context}`
      },
      // Include previous chat history
      ...chatHistory,
      {
        role: "user",
        content: message
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      max_tokens: 500
    });

    return Response.json({ 
      reply: response.choices[0].message.content,
      context: messages
    });
  } catch (error) {
    console.error('Chat error:', error);
    return Response.json(
      { error: 'Failed to process chat message', details: error.message },
      { status: 500 }
    );
  }
} 