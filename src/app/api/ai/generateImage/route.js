// File: app/api/ai/generateImage/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import OpenAI from 'openai';

// Create a new OpenAI client using your key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { itemName, brandVoice, styleWanted, tone } = await request.json();

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Professional food photography of ${itemName}. Style: ${styleWanted}. Mood: ${tone}. Brand voice: ${brandVoice}.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    return NextResponse.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: error.message },
      { status: 500 }
    );
  }
}