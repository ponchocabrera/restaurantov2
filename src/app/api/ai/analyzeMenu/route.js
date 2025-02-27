import OpenAI from 'openai';
import { saveMenuAnalysis } from '@/db/index';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  console.log('Received analysis request');

  // Retrieve the current session to get the logged-in user
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { type, imageData, language } = await request.json();
    console.log('Analysis type:', type);

    // Determine if Spanish output is required
    const shouldRespondInSpanish = language === "es";
    const languageInstruction = shouldRespondInSpanish
      ? "Responde en español."
      : "";
    
    // Define your system prompt. Append the instruction if needed.
    const systemPrompt = `
      You are an expert menu design analyst with deep knowledge of restaurant psychology, design principles, and menu engineering.
      Analyze this menu and provide an extremely detailed analysis in the following sections:
      
      STRUCTURE:
      - List all menu sections and categories
      - Detail the hierarchy and organization
      - Analyze section placement and flow
      - Note any special features or callouts
      - Evaluate the information architecture
      - Analyze category balance and item distribution
      - Identify menu complexity level
      - Review section ordering logic
      
      DESIGN:
      - Typography analysis (fonts, sizes, weights, spacing)
      - Layout patterns and grid system used
      - Visual hierarchy implementation
      - White space utilization
      - Decorative elements and their purpose
      - Text alignment and justification
      - Headers and subheaders treatment
      - Overall composition balance
      - Brand identity integration
      - Design consistency evaluation
      - Readability assessment
      - Mobile/digital adaptation potential
      
      PRICING:
      - Price presentation style and formatting
      - Price positioning relative to items
      - Price anchoring techniques used
      - Value perception indicators
      - Price clustering analysis
      - Premium item placement
      - Competitive pricing analysis
      - Price psychology implementation
      - Value proposition clarity
      - Price-to-value relationship
      - Upselling opportunities
      - Price bracketing strategy
      
      COLOR:
      - Detailed color palette analysis
      - Primary, secondary, and accent colors
      - Color psychology implications
      - Background/foreground color relationships
      - Color contrast and readability
      - Texture and pattern usage
      - Brand color consistency
      - Color temperature and mood
      - Cultural color considerations
      - Seasonal color adaptability
      - Color accessibility evaluation
      - Emotional impact assessment
      
      VISUAL ELEMENTS:
      - Image usage and quality
      - Icons and symbols
      - Borders and dividers
      - Boxes and containers
      - Decorative flourishes
      - Background elements
      - Logo integration
      - Special callouts or highlights
      - Visual hierarchy effectiveness
      - Negative space utilization
      - Visual flow patterns
      - Brand element consistency
      
      CUSTOMER PSYCHOLOGY:
      - Decision-making triggers
      - Attention flow analysis
      - Choice architecture
      - Psychological pricing effects
      - Visual appetite stimulation
      - Brand perception impact
      - Decision paralysis points
      - Emotional response triggers
      - Trust-building elements
      - Social proof integration
      - Scarcity/urgency indicators
      - Customer journey mapping

      ${languageInstruction}
    `;

    if (type === 'image') {
      console.log('Starting OpenAI analysis...');
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this menu image in detail following the specified sections." },
              { type: "image_url", image_url: { url: imageData } }
            ]
          }
        ],
        max_tokens: 4096
      });

      console.log('OpenAI response received');
      const analysisText = response.choices[0].message.content;
      
      function extractSection(text, sectionName) {
        if (!text || typeof text !== 'string') {
          console.error(`Invalid text for section ${sectionName}:`, text);
          return [];
        }

        try {
          const sectionRegex = new RegExp(`${sectionName}:[\\s\\S]*?(?=\\n\\n[A-Z ]+:|$)`);
          const match = text.match(sectionRegex);
          
          if (!match) {
            console.log(`No match found for section ${sectionName}`);
            return [];
          }
          
          return match[0]
            .replace(`${sectionName}:`, '')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && line.startsWith('-'))
            .map(line => line.substring(1).trim());
        } catch (error) {
          console.error(`Error extracting section ${sectionName}:`, error);
          return [];
        }
      }

      const sections = {
        structure: extractSection(analysisText, 'STRUCTURE'),
        design: extractSection(analysisText, 'DESIGN'),
        pricing: extractSection(analysisText, 'PRICING'),
        color: extractSection(analysisText, 'COLOR'),
        visualElements: extractSection(analysisText, 'VISUAL ELEMENTS'),
        psychology: extractSection(analysisText, 'CUSTOMER PSYCHOLOGY')
      };

      // Prepare the analysis object with the raw output and the parsed sections
      const analysisRecord = { raw: analysisText, ...sections };

      function deduplicateAnalysis(analysis) {
        const seen = new Set();
        
        const dedupeSection = (section) => {
          if (!Array.isArray(section)) return section;
          return section.filter(item => {
            const key = typeof item === 'string' ? 
              item.toLowerCase().trim() : 
              JSON.stringify(item).toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        };

        return {
          ...analysis,
          structure: dedupeSection(analysis.structure),
          design: dedupeSection(analysis.design),
          pricing: dedupeSection(analysis.pricing),
          color: dedupeSection(analysis.color),
          visualElements: dedupeSection(analysis.visualElements),
          psychology: dedupeSection(analysis.psychology),
          engineering: dedupeSection(analysis.engineering),
          customerExperience: dedupeSection(analysis.customerExperience)
        };
      }

      // Use this before saving the analysis
      const dedupedAnalysis = deduplicateAnalysis(analysisRecord);
      const savedRecord = await saveMenuAnalysis(userId, dedupedAnalysis, imageData);
      console.log('Saved analysis with ID:', savedRecord.id);

      // Merge the saved id with the analysis record
      const analysisWithId = { id: savedRecord.id, ...dedupedAnalysis };

      // Return the analysis (including the id) to be used in recommendations generation
      return Response.json({ analysis: analysisWithId });
    }

    return Response.json({ error: 'Invalid type' });
  } catch (error) {
    console.error('Analysis failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 