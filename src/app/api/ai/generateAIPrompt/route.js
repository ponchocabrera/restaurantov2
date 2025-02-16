import { getLatestMenuAnalysis, getLatestRestaurantSearch } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    // Parse any provided payload; otherwise, fetch from the database.
    const { analysis: inputAnalysis, search: inputSearch } = await request.json().catch(() => ({}));
    let analysis = inputAnalysis && inputAnalysis.id ? inputAnalysis : await getLatestMenuAnalysis();
    let search = inputSearch && inputSearch.id ? inputSearch : await getLatestRestaurantSearch();

    if (!analysis || !search) {
      throw new Error('Missing data from menu analysis or restaurant searches.');
    }

    // Extract dish insights and area insights using the correct DB column names.
    // Note: In your sample, these fields come in as strings.
    const rawDishInsights = analysis.dish_insights || [];
    const rawAreaInsights = search.area_insights || [];

    // If the insights are strings (as in your sample), convert them to arrays.
    const dishInsights =
      typeof rawDishInsights === 'string'
        ? rawDishInsights.split('\n').map(line => line.trim()).filter(Boolean)
        : rawDishInsights;
    const areaInsights =
      typeof rawAreaInsights === 'string'
        ? rawAreaInsights.split('\n').map(line => line.trim()).filter(Boolean)
        : rawAreaInsights;

    // Log the raw and processed insights for debugging.
    console.log("Raw dish insights:", rawDishInsights);
    console.log("Processed dish insights array:", dishInsights);
    console.log("Raw area insights:", rawAreaInsights);
    console.log("Processed area insights array:", areaInsights);
    console.log("Type of dishInsights:", typeof dishInsights);
    console.log("Type of areaInsights:", typeof areaInsights);

    // Build your sections; if any section is missing, default to an empty array.
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

    // Generate prompt sections from analysis data.
    const promptSections = Object.entries(sections)
      .map(([section, items]) => {
        return `${section.toUpperCase()}:\n${items.slice(0, 5).join('\n')}`;
      })
      .join('\n\n');

    console.log("Constructed prompt sections:", promptSections);

    // Construct the complete prompt with additional dish and area insights.
    const enhancedPrompt = `
Market Search Analysis:
- Restaurant: ${search.restaurant_name || "Unknown"}
- Star Rating: ${search.star_rating || 'N/A'}
- Analysis Date: ${search.created_at ? new Date(search.created_at).toLocaleDateString() : 'N/A'}

Key Dish Insights:
${dishInsights.slice(0, 5).map(i => `• ${i}`).join('\n') || 'No significant dish insights'}

Area Trends:
${areaInsights.slice(0, 5).map(i => `• ${i}`).join('\n') || 'No notable area trends'}

Menu Analysis Breakdown:
${Object.entries(sections)
  .map(([section, items]) => 
    `## ${section.toUpperCase().replace(/_/g, ' ')}:\n${
      items.slice(0, 5)
        .map((item, idx) => `${idx + 1}. ${item.replace(/\*\*/g, '').replace(/-/g, '')}`)
        .join('\n')
    }`
  ).join('\n\n')}

Generate 4-6 concrete recommendations PER CATEGORY following EXACTLY this format:

[Category Name]
1. **Specific Recommendation:** [Clear action]
   **Reasoning:** [Connect to dish/area insights: ${dishInsights[0]?.split(':')[0] || "Menu structure"} and ${areaInsights[0]?.split(':')[0] || "local trends"}]
   **Expected Impact:** [Quantifiable outcome]
   **Priority:** High/Medium/Low

2. **Specific Recommendation:** [Next action...]

Categories to address:
1. Psychology & Colors
2. Layout & Design  
3. Pricing Strategy
4. Menu Engineering
5. Visual Hierarchy
6. Customer Experience
7. Dish Presentation
8. Market Positioning

Focus on actionable steps leveraging: 
- ${dishInsights.slice(0,2).join('; ')}
- ${areaInsights.slice(0,2).join('; ')}
`.trim();

    // Log the full enhanced prompt.
    console.log("Enhanced Prompt:", enhancedPrompt);

    // Also log the full analysis and search records.
    console.log("Fetched analysis record:", analysis);
    console.log("Fetched search record:", search);

    // Send the prompt to OpenAI.
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert menu optimization consultant with deep knowledge of restaurant psychology, design principles, and menu engineering. Provide detailed and actionable recommendations that can be implemented immediately."
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000
    });

    console.log("OpenAI API Response:", response);

    // Return OpenAI's response.
    return new Response(JSON.stringify({ prompt: response.choices[0].message.content }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in generateAIPrompt:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 