import { NextResponse } from 'next/server';
import { generateClaudeHTML } from '@/services/claudeService';

export async function POST(request) {
  try {
    const { prompt, menuItems, config } = await request.json();
    if (!menuItems || !config) {
      throw new Error('Missing required data: menuItems or config');
    }
    const generatedHTML = await generateClaudeHTML(prompt, { menuItems }, config);
    if (!generatedHTML) {
      throw new Error('No HTML was generated');
    }
    return NextResponse.json({ html: generatedHTML });
  } catch (error) {
    console.error('Error generating HTML:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate menu HTML' },
      { status: 500 }
    );
  }
}
