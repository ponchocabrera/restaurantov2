import { OpenAI } from 'openai';
import { generateAnalysisRecommendations } from '@/utils/menuAnalysisProcessor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  console.log('Received analysis request');
  const { type, imageData, menuText } = await request.json();
  console.log('Analysis type:', type);

  if (type === 'image') {
    try {
      console.log('Starting OpenAI analysis...');
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a menu design expert. Analyze the menu and provide structured feedback in these sections:
              STRUCTURE: List the menu's structural elements and organization
              DESIGN: Analyze visual design elements, typography, and layout
              PSYCHOLOGY: Evaluate menu psychology factors and their implementation
              ENGINEERING: Assess menu engineering principles and item placement
              PRICING: Review pricing strategies and presentation
              COLOR: Analyze color usage and psychological impact`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this menu comprehensively based on menu psychology research and design principles." },
              { type: "image_url", image_url: { url: imageData } }
            ]
          }
        ],
        max_tokens: 4096
      });
      console.log('OpenAI response received');

      const rawAnalysis = response.choices[0].message.content;
      const parsedAnalysis = {
        structure: [],
        design: [],
        recommendations: {
          psychology: [],
          engineering: [],
          pricing: [],
          color: []
        }
      };

      // Parse sections using regex
      const sections = rawAnalysis.split(/STRUCTURE:|DESIGN:|PSYCHOLOGY:|ENGINEERING:|PRICING:|COLOR:/);
      if (sections.length >= 7) {
        parsedAnalysis.structure = sections[1].trim().split('\n').filter(line => line.trim()).map(item => item.replace(/^[•-]\s*/, ''));
        parsedAnalysis.design = sections[2].trim().split('\n').filter(line => line.trim()).map(item => item.replace(/^[•-]\s*/, ''));
        parsedAnalysis.recommendations.psychology = sections[3].trim().split('\n').filter(line => line.trim()).map(item => item.replace(/^[•-]\s*/, ''));
        parsedAnalysis.recommendations.engineering = sections[4].trim().split('\n').filter(line => line.trim()).map(item => item.replace(/^[•-]\s*/, ''));
        parsedAnalysis.recommendations.pricing = sections[5].trim().split('\n').filter(line => line.trim()).map(item => item.replace(/^[•-]\s*/, ''));
        parsedAnalysis.recommendations.color = sections[6].trim().split('\n').filter(line => line.trim()).map(item => item.replace(/^[•-]\s*/, ''));
      }

      return Response.json(parsedAnalysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      return Response.json({ error: 'Analysis failed', details: error.message }, { status: 500 });
    }
  }
  
  // If text analysis is needed
  try {
    const textAnalysis = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a menu design expert. Analyze the provided menu text."
        },
        {
          role: "user",
          content: menuText
        }
      ]
    });

    const analysis = textAnalysis.choices[0].message.content;
    const recommendations = generateAnalysisRecommendations(analysis);
    
    return Response.json({ analysis, recommendations });
  } catch (openAIError) {
    console.error('OpenAI API Error:', openAIError);
    return Response.json({ 
      error: 'Failed to analyze menu text',
      details: openAIError.message 
    }, { status: 500 });
  }
}

// Helper function to extract sections from the AI response
function extractSection(text, sectionName) {
  const sections = text.split(/\n\n|\r\n\r\n/);
  const relevantSection = sections.find(s => 
    s.toLowerCase().includes(sectionName.toLowerCase())
  );
  
  if (!relevantSection) return [];
  
  return relevantSection
    .split('\n')
    .filter(line => line.trim() && !line.toLowerCase().includes(sectionName.toLowerCase()))
    .map(line => line.replace(/^[-•*]\s*/, '').trim());
} 