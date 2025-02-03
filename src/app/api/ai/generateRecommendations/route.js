import OpenAI from 'openai';
import { MENU_RESEARCH } from '@/utils/researchProcessor';
import { generateAnalysisRecommendations } from '@/utils/menuAnalysisProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    const { analysis } = await request.json();
    console.log('Received analysis for recommendations:', analysis);
    
    // Load research data
    const researchData = MENU_RESEARCH;
    console.log('Loaded research data:', researchData);

    // Build enhanced prompt with analysis and research
    const enhancedPrompt = `
As a menu optimization expert, analyze this menu and provide detailed recommendations based on our research and the previous analysis.

ANALYSIS SUMMARY:
${analysis}

RESEARCH INSIGHTS:
Psychology Factors:
${researchData.psychology_factors.map(f => `- ${f.description} (${Math.round(f.effectiveness * 100)}% effective)`).join('\n')}

Layout Guidelines:
${researchData.layout_guidelines.map(g => `- ${g.description} (Priority: ${g.priority})`).join('\n')}

For each category below, provide 2-3 specific recommendations. Format each recommendation exactly as follows:

1. **Specific Recommendation:** [The recommendation]
**Reasoning:** [Why this recommendation is important]
**Expected Impact:** [What results to expect]
**Implementation Priority:** [High/Medium/Low]

PSYCHOLOGY & COLORS:
[Your recommendations here]

LAYOUT & DESIGN:
[Your recommendations here]

MENU ENGINEERING:
[Your recommendations here]

PRICING STRATEGY:
[Your recommendations here]`;

    console.log('Sending enhanced prompt to OpenAI:', enhancedPrompt);

    // Get AI recommendations
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a menu optimization expert with deep knowledge of restaurant psychology and design principles."
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      max_tokens: 4096
    });

    console.log('Raw OpenAI response:', response.choices[0].message.content);

    // Process and structure the recommendations
    const aiRecommendations = response.choices[0].message.content;

    // Process each section
    const recommendations = {
      psychology: processRecommendations(aiRecommendations, 'PSYCHOLOGY & COLORS'),
      design: processRecommendations(aiRecommendations, 'LAYOUT & DESIGN'),
      engineering: processRecommendations(aiRecommendations, 'MENU ENGINEERING'),
      pricing: processRecommendations(aiRecommendations, 'PRICING STRATEGY')
    };

    // Log each section's processed recommendations
    Object.entries(recommendations).forEach(([section, recs]) => {
      console.log(`Processed ${section} recommendations:`, recs);
    });

    return Response.json({ recommendations });
  } catch (error) {
    console.error('Recommendations generation failed:', error);
    return Response.json(
      { error: 'Recommendations generation failed', details: error.message }, 
      { status: 500 }
    );
  }
}

function processRecommendations(text, section) {
  try {
    // First, find the section
    const sectionStart = text.indexOf(`${section}:`);
    if (sectionStart === -1) return [];
    
    // Get the text after our section header
    const textAfterSection = text.slice(sectionStart + section.length);
    
    // Find the next section (if any)
    const nextSectionMatch = textAfterSection.match(/\n\n[A-Z& ]+:/);
    const sectionEnd = nextSectionMatch 
      ? sectionStart + section.length + nextSectionMatch.index 
      : text.length;
    
    // Extract section content
    const sectionContent = text.slice(sectionStart, sectionEnd);
    
    console.log(`Processing ${section} content:`, sectionContent); // Debug log

    // Split into individual recommendations
    const recommendations = sectionContent
      .split(/\d+\.\s+/)
      .slice(1) // Remove the section header
      .map(block => {
        const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
        
        const rec = {
          recommendation: lines[0]?.replace(/^\*\*Specific Recommendation:\*\*\s*/, '').trim(),
          reasoning: lines.find(l => l.includes('**Reasoning:**'))
            ?.replace(/^\*\*Reasoning:\*\*\s*/, '').trim(),
          impact: lines.find(l => l.includes('**Expected Impact:**'))
            ?.replace(/^\*\*Expected Impact:\*\*\s*/, '').trim(),
          priority: lines.find(l => l.includes('**Implementation Priority:**'))
            ?.replace(/^\*\*Implementation Priority:\*\*\s*/, '').trim()
        };
        
        console.log(`Processed recommendation:`, rec); // Debug log
        return rec;
      })
      .filter(rec => rec.recommendation);

    return recommendations;
  } catch (error) {
    console.error(`Error processing ${section} recommendations:`, error);
    return [];
  }
} 