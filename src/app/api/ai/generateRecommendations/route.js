import OpenAI from 'openai';
import { updateMenuAnalysisRecommendations } from '@/db/index';
import { MENU_RESEARCH } from '@/utils/researchProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper to deduplicate recommendations (works for objects or strings)
function dedupeRecommendations(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  return items.filter(item => {
    let key;
    if (typeof item === 'object' && item !== null && item.recommendation) {
      key = item.recommendation.toLowerCase().trim();
    } else if (typeof item === 'string') {
      key = item.toLowerCase().trim();
    } else {
      key = JSON.stringify(item).toLowerCase();
    }
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Helper function to process recommendations for a given section.
// It looks for a block starting with the provided sectionHeader and extracts recommendations 
// based on the expected format.
function processRecommendations(text, section) {
  const sectionRegex = new RegExp(`${section}:[\\s\\S]*?(?=\\n\\n[A-Z &]+:|$)`);
  const match = text.match(sectionRegex);
  if (!match) return [];

  const recommendations = [];
  const seen = new Set();
  let currentRec = null;
  
  const lines = match[0].split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  
  lines.forEach(line => {
    if (line === section + ':') return;
    
    const recommendationMatch = line.match(/\*\*Specific Recommendation:\*\*(.*)/i);
    if (recommendationMatch) {
      const recText = recommendationMatch[1].trim();
      const recKey = recText.toLowerCase();
      
      if (!seen.has(recKey)) {
        if (currentRec) recommendations.push(currentRec);
        currentRec = { recommendation: recText };
        seen.add(recKey);
      } else {
        currentRec = null;
      }
      return;
    }
    
    if (!currentRec) return;
    
    const propertyMatch = line.match(/\*\*(.*?):\*\*(.*)/);
    if (propertyMatch) {
      const [, key, value] = propertyMatch;
      const cleanKey = key.toLowerCase().replace(/\s+/g, '_');
      currentRec[cleanKey] = value.trim();
    }
  });
  
  if (currentRec) recommendations.push(currentRec);
  return recommendations;
}

export async function POST(request) {
  try {
    const { analysis } = await request.json();
    console.log('Received analysis for recommendations:', analysis);
    
    if (!analysis || !analysis.raw || !analysis.id) {
      throw new Error('Invalid analysis data: missing id or raw analysis');
    }

    // Use all available sections from the analysis
    const sections = {
      structure: analysis.structure || [],
      design: analysis.design || [],
      pricing: analysis.pricing || [],
      color: analysis.color || [],
      visualElements: analysis.visualElements || [],
      psychology: analysis.psychology || [],
      engineering: analysis.engineering || [],
      customerExperience: analysis.customerExperience || []
    };

    // Build a more comprehensive prompt
    const enhancedPrompt = `
Analyze these findings and provide detailed menu recommendations:

${Object.entries(sections)
  .map(([section, items]) =>
    `${section.toUpperCase()}:\n${dedupeRecommendations(items).slice(0, 5).map(item => `- ${item}`).join('\n')}`
  )
  .join('\n\n')}

For each category below, provide 4-6 detailed recommendations. Format exactly as:
**Specific Recommendation:** [clear, actionable step]
**Reasoning:** [detailed explanation referencing the analysis]
**Expected Impact:** [specific benefits and outcomes]
**Priority:** [High/Medium/Low]

PSYCHOLOGY & COLORS:
LAYOUT & DESIGN:
PRICING STRATEGY:
MENU ENGINEERING:
VISUAL HIERARCHY:
CUSTOMER EXPERIENCE:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert menu optimization consultant with deep knowledge of restaurant psychology, design principles, and menu engineering. 
Provide detailed, actionable recommendations that will have significant impact on the menu's performance. 
Focus on practical steps that can be implemented immediately.`
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000
    });

    const aiRecommendations = response.choices[0].message.content;
    console.log('Raw AI recommendations:', aiRecommendations);

    // Process and deduplicate recommendations
    const recommendations = {
      psychology: dedupeRecommendations(processRecommendations(aiRecommendations, 'PSYCHOLOGY & COLORS')),
      design: dedupeRecommendations(processRecommendations(aiRecommendations, 'LAYOUT & DESIGN')),
      pricing: dedupeRecommendations(processRecommendations(aiRecommendations, 'PRICING STRATEGY')),
      engineering: dedupeRecommendations(processRecommendations(aiRecommendations, 'MENU ENGINEERING')),
      visualHierarchy: dedupeRecommendations(processRecommendations(aiRecommendations, 'VISUAL HIERARCHY')),
      customerExperience: dedupeRecommendations(processRecommendations(aiRecommendations, 'CUSTOMER EXPERIENCE'))
    };

    // Ensure each section has at least an empty array
    Object.keys(recommendations).forEach(key => {
      if (!recommendations[key]) recommendations[key] = [];
    });

    // Validate and ensure minimum recommendations
    Object.entries(recommendations).forEach(([section, recs]) => {
      if (!recs || recs.length < 3) {
        console.error(`Insufficient recommendations generated for ${section}`);
      }
    });

    const updatedRecord = await updateMenuAnalysisRecommendations(analysis.id, recommendations);
    console.log('Recommendations updated for analysis ID:', updatedRecord.id);

    return Response.json({ recommendations: updatedRecord.recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 
