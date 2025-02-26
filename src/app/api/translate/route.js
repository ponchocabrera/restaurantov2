import { NextResponse } from 'next/server';
import { v2 as TranslationV2 } from '@google-cloud/translate';

// Create a translator instance using your API key
const translate = new TranslationV2.Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });

export async function POST(request) {
  try {
    const { text, target } = await request.json();
    if (!text || !target) {
      return NextResponse.json({ error: 'Missing text or target language code in request.' }, { status: 400 });
    }

    // Perform the translation
    const [translation] = await translate.translate(text, target);

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 