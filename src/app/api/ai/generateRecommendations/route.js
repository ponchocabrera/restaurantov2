import OpenAI from 'openai';
import { MENU_RESEARCH } from '@/utils/researchProcessor';
import { generateAnalysisRecommendations } from '@/utils/menuAnalysisProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    const { analysis } = await request.json();
    
    // First, get AI-powered recommendations based on the analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a menu optimization expert with deep knowledge of restaurant psychology and design principles. Using the provided detailed menu analysis, generate specific, actionable recommendations in these categories:

PSYCHOLOGY & COLORS:
- Color psychology implementation
- Visual perception optimization
- Customer behavior influence
- Emotional response triggers
- Brand consistency recommendations

LAYOUT & DESIGN:
- Typography improvements
- Space utilization optimization
- Visual hierarchy enhancement
- Navigation flow optimization
- Accessibility improvements

MENU ENGINEERING:
- Item placement optimization
- Category organization
- Profitability enhancement
- Visual emphasis suggestions
- Cross-selling opportunities

PRICING STRATEGY:
- Price presentation optimization
- Value perception enhancement
- Premium item positioning
- Price anchoring implementation
- Psychological pricing tactics

Base your recommendations on proven research and industry best practices. Provide specific, actionable suggestions that can be implemented immediately.`
        },
        {
          role: "user",
          content: `Generate detailed recommendations based on this menu analysis:\n\n${analysis}`
        }
      ],
      max_tokens: 4096
    });

    // Process the AI response and combine with research data
    const aiRecommendations = response.choices[0].message.content;
    const researchBasedRecs = generateAnalysisRecommendations(analysis);

    // Combine and structure all recommendations
    const recommendations = {
      psychology: [
        ...researchBasedRecs.recommendations.psychology,
        ...extractSection(aiRecommendations, 'Psychology & Colors')
      ],
      design: [
        ...researchBasedRecs.recommendations.design,
        ...extractSection(aiRecommendations, 'Layout & Design')
      ],
      engineering: [
        ...researchBasedRecs.recommendations.engineering,
        ...extractSection(aiRecommendations, 'Menu Engineering')
      ],
      pricing: [
        ...researchBasedRecs.recommendations.pricing,
        ...extractSection(aiRecommendations, 'Pricing Strategy')
      ]
    };

    return Response.json({ recommendations });
  } catch (error) {
    console.error('Recommendations generation failed:', error);
    return Response.json(
      { error: 'Recommendations generation failed', details: error.message }, 
      { status: 500 }
    );
  }
}

function extractSection(text, sectionName) {
  const sectionRegex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n\\n|$)`);
  const match = text.match(sectionRegex);
  if (!match) return [];
  
  return match[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.includes(`${sectionName}:`))
    .map(line => line.replace(/^[-•*]\s*/, ''));
} 