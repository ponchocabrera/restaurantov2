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

    // Enable streaming
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const streamResponse = new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    // Create completion with streaming
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a menu optimization expert. Use the provided analysis, recommendations, and research data to help users understand and implement menu improvements. Be specific and reference the analysis when answering questions."
        },
        {
          role: "user",
          content: `Context: ${context}`
        },
        ...chatHistory,
        {
          role: "user",
          content: message
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 500
    });

    // Process the stream
    (async () => {
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }
        // Send the [DONE] message
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Streaming error:', error);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    return streamResponse;
  } catch (error) {
    console.error('Chat error:', error);
    return Response.json(
      { error: 'Failed to process chat message', details: error.message },
      { status: 500 }
    );
  }
} 