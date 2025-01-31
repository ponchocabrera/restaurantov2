// app/api/ai/generateHTML/route.js
import { NextResponse } from 'next/server';
import { generateClaudeHTML } from '@/services/claudeService';

export async function POST(request) {
  console.log('Starting HTML generation with Claude...');
  try {
    const { prompt, menuItems, config } = await request.json();
    
    // Use the Claude service to generate HTML
    const generatedHTML = await generateClaudeHTML(prompt, { menuItems }, config);
    
    // Return Claude's generated HTML directly without modification
    return NextResponse.json({ html: generatedHTML });
  } catch (error) {
    console.error('Error generating HTML:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}