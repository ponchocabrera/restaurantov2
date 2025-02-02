// app/api/ai/generatePrompt/route.js
import { NextResponse } from 'next/server';
import { openai } from '@/lib/api-clients';
import { generateDesignRecommendations } from '@/utils/researchProcessor';

export async function POST(request) {
  try {
    const { menuItems, config } = await request.json();

    // Generate design recommendations based on menu style
    const itemsAnalysis = {
      bestSellers: menuItems.filter(item => item.sales_performance === 'best_seller'),
      highMargin: menuItems.filter(item => item.margin_level === 'high_margin'),
      boostedItems: menuItems.filter(item => item.boost_desired)
    };

    const initialRecs = generateDesignRecommendations(config.style, itemsAnalysis);

    // Call OpenAI to generate the prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are MenuGPT, an advanced AI menu design system. Generate SPECIFIC and DETAILED recommendations using exact values and measurements. Format your response precisely as shown below:

DESIGN OVERVIEW
- List specific design elements and approaches
- Use clear, actionable recommendations

COLOR SCHEME
Brand Colors:
- Primary: [HEX CODE]
- Secondary: [HEX CODE]
Required Colors (use exact hex codes):
- Background Color: #XXXXXX
- Section Background Colors: #XXXXXX
- Highlight Color: #XXXXXX
- Border Colors: #XXXXXX
- Item Card Background Colors: #XXXXXX

LAYOUT STRUCTURE
- Specific measurements and spacing
- Exact pattern descriptions
- Precise border specifications

DESIGN RECOMMENDATIONS
Typography:
- Headings: [Font Name] (24px)
- Item Names: [Font Name] (18px)
- Item Details: [Font Name] (14px)

Spacing:
- Section Padding: [X]px top, [Y]px bottom
- Item Card Padding: [Z]px

Visual Hierarchy:
- Best Sellers: [specific treatment]
- High-Margin Items: [specific treatment]
- Priority Items: [specific treatment]`
        },
        {
          role: "user",
          content: `Create detailed design recommendations for a ${config.style} ${config.pageCount}-page menu with:
Primary Color: ${config.primaryColor}
Secondary Color: ${config.secondaryColor}
Paper Size: ${config.paperSize}

Menu Items:
${menuItems.map(item => `- ${item.name} (${item.sales_performance === 'best_seller' ? 'Best Seller' : ''} ${item.margin_level === 'high_margin' ? 'High Margin' : ''})`.trim()).join('\n')}

Format your response exactly with these sections:
DESIGN OVERVIEW
COLOR SCHEME
LAYOUT STRUCTURE
DESIGN RECOMMENDATIONS`
        }
      ]
    });

    const generatedPrompt = completion.choices[0].message.content;

    // Extract color and typography information from the generated prompt
    const colorScheme = generatedPrompt.match(/COLOR SCHEME([\s\S]*?)(?=LAYOUT STRUCTURE)/)[1];
    const designRecommendations = generatedPrompt.match(/DESIGN RECOMMENDATIONS([\s\S]*?)$/)[1];

    // Parse colors and typography from the response
    const colors = {
      background: colorScheme.match(/#[A-Fa-f0-9]{6}/g)?.[0] || '#F5F5F5',
      sections: colorScheme.match(/#[A-Fa-f0-9]{6}/g)?.[1] || '#FFFFFF',
      highlight: colorScheme.match(/#[A-Fa-f0-9]{6}/g)?.[2] || '#FFD700',
      border: colorScheme.match(/#[A-Fa-f0-9]{6}/g)?.[3] || '#666666',
      itemCard: colorScheme.match(/#[A-Fa-f0-9]{6}/g)?.[4] || '#FFFFFF'
    };

    const typography = {
      headings: { 
        font: designRecommendations.match(/Headings:\s*([^,\n]*)/)?.[1] || 'Montserrat',
        size: designRecommendations.match(/Headings:[^(]*\(([^)]*)\)/)?.[1] || '24px'
      },
      items: {
        font: designRecommendations.match(/Item Names:\s*([^,\n]*)/)?.[1] || 'Lato',
        size: designRecommendations.match(/Item Names:[^(]*\(([^)]*)\)/)?.[1] || '18px'
      },
      details: {
        font: designRecommendations.match(/Item Details:\s*([^,\n]*)/)?.[1] || 'Lato',
        size: designRecommendations.match(/Item Details:[^(]*\(([^)]*)\)/)?.[1] || '14px'
      }
    };

    return NextResponse.json({ 
      prompt: generatedPrompt,
      suggestions: { colors, typography }
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}