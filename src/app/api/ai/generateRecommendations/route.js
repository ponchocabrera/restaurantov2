import OpenAI from 'openai';
import { updateMenuAnalysisRecommendations } from '@/db/index';
import { MENU_RESEARCH } from '@/utils/researchProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    const { analysis } = await request.json();
    console.log('Received analysis for recommendations:', analysis);
    
    if (!analysis || !analysis.raw || !analysis.id) {
      throw new Error('Invalid analysis data: missing id or raw analysis');
    }

    // Parse the raw analysis text into structured sections
    const analysisText = analysis.raw;
    const sections = {
      structure: analysis.structure || [],
      design: analysis.design || [],
      pricing: analysis.pricing || [],
      color: analysis.color || [],
      visualElements: analysis.visualElements || [],
      psychology: analysis.psychology || []
    };

    // Build a more concise prompt
    const enhancedPrompt = `
Analyze these findings and provide targeted menu recommendations:

${Object.entries(sections)
  .map(([section, items]) => `${section.toUpperCase()}:\n${items.slice(0, 3).map(item => `- ${item}`).join('\n')}`)
  .join('\n\n')}

Provide 3-4 recommendations for each category below. Format exactly as:
**Specific Recommendation:** [action]
**Reasoning:** [reference findings]
**Expected Impact:** [result]
**Priority:** [High/Medium/Low]

PSYCHOLOGY & COLORS:
LAYOUT & DESIGN:
MENU ENGINEERING:
PRICING STRATEGY:
VISUAL HIERARCHY:
CUSTOMER EXPERIENCE:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a menu optimization expert. Provide specific, actionable recommendations based on the analysis findings."
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048
    });

    const aiRecommendations = response.choices[0].message.content;
    console.log('Raw AI recommendations:', aiRecommendations);

    const recommendations = {
      psychology: processRecommendations(aiRecommendations, 'PSYCHOLOGY & COLORS'),
      design: processRecommendations(aiRecommendations, 'LAYOUT & DESIGN'),
      engineering: processRecommendations(aiRecommendations, 'MENU ENGINEERING'),
      pricing: processRecommendations(aiRecommendations, 'PRICING STRATEGY'),
      visualHierarchy: processRecommendations(aiRecommendations, 'VISUAL HIERARCHY'),
      customerExperience: processRecommendations(aiRecommendations, 'CUSTOMER EXPERIENCE')
    };

    // Validate recommendations
    Object.entries(recommendations).forEach(([section, recs]) => {
      if (!recs || recs.length === 0) {
        console.error(`No recommendations generated for ${section}`);
      }
    });

    // Save the recommendations in the database by updating the analysis record
    const updatedRecord = await updateMenuAnalysisRecommendations(analysis.id, recommendations);
    console.log('Recommendations updated for analysis ID:', updatedRecord.id);

    // Return the updated recommendations
    return Response.json({ recommendations: updatedRecord.recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function processRecommendations(text, section) {
  try {
    // First, find the section
    const sectionStart = text.indexOf(`${section}:`);
    if (sectionStart === -1) return [];
    
    // Get the text after our section header
    const textAfterSection = text.slice(sectionStart + section.length + 1);
    
    // Find the next section (if any)
    const nextSectionMatch = textAfterSection.match(/\n\n[A-Z& ]+:/);
    const sectionEnd = nextSectionMatch 
      ? nextSectionMatch.index 
      : textAfterSection.length;
    
    // Extract section content
    const sectionContent = textAfterSection.slice(0, sectionEnd).trim();
    
    // Create a Set to track unique recommendations
    const uniqueRecs = new Set();
    
    // Split into individual recommendations and process
    const recommendations = sectionContent
      .split(/(?=\*\*Specific Recommendation:\*\*)/)
      .filter(rec => rec.trim())
      .map(rec => {
        const recommendation = rec.match(/\*\*Specific Recommendation:\*\*([^\n]*)/)?.[1]?.trim() || '';
        const reasoning = rec.match(/\*\*Reasoning:\*\*([^\n]*)/)?.[1]?.trim() || '';
        const impact = rec.match(/\*\*Expected Impact:\*\*([^\n]*)/)?.[1]?.trim() || '';
        const priority = rec.match(/\*\*Priority:\*\*([^\n]*)/)?.[1]?.trim() || '';

        return {
          recommendation,
          reasoning,
          impact,
          priority
        };
      })
      .filter(rec => {
        // Only include if recommendation is not empty and not seen before
        if (!rec.recommendation || uniqueRecs.has(rec.recommendation)) {
          return false;
        }
        uniqueRecs.add(rec.recommendation);
        return true;
      });

    return recommendations;
  } catch (error) {
    console.error(`Error processing ${section} recommendations:`, error);
    return [];
  }
} 