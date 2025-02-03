import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  console.log('Received analysis request');
  try {
    const { type, imageData } = await request.json();
    console.log('Analysis type:', type);

    if (type === 'image') {
      console.log('Starting OpenAI analysis...');
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert menu design analyst with deep knowledge of restaurant psychology, design principles, and menu engineering. Analyze this menu and provide an extremely detailed analysis in these exact sections:

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
- Customer journey mapping`
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
      return Response.json({ analysis: response.choices[0].message.content });
    }

    return Response.json({ error: 'Invalid type' });
  } catch (error) {
    console.error('Analysis failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
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