import OpenAI from 'openai';
import { getLatestMenuAnalysis, getLatestRestaurantSearch } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    // Optional payload can include extra context for the prompt
    const { customContext } = await request.json().catch(() => ({}));

    // Fetch the latest analysis and market search data.
    const analysis = await getLatestMenuAnalysis();
    const search = await getLatestRestaurantSearch();

    if (!analysis || !search) {
      throw new Error("Missing analysis or search data.");
    }

    // Process dish insights, using search first; if not available, fallback to analysis
    const dishInsightsFromSearch =
      typeof search.dish_insights === 'string'
        ? search.dish_insights.split('\n').map(line => line.trim()).filter(Boolean)
        : (search.dish_insights || []);
    const dishInsightsFromAnalysis =
      typeof analysis.dish_insights === 'string'
        ? analysis.dish_insights.split('\n').map(line => line.trim()).filter(Boolean)
        : (analysis.dish_insights || []);
    
    const dishInsights = [...dishInsightsFromSearch, ...dishInsightsFromAnalysis].filter(Boolean);

    // Process area insights
    const areaInsights =
      typeof search.area_insights === 'string'
        ? search.area_insights.split('\n').map(line => line.trim()).filter(Boolean)
        : search.area_insights || [];

    // Attempt to identify a local trend—for example, "crepes" or other recurring terms
    let localTrend = 'your popular dishes'; // default fallback
    const loweredAreaInsights = areaInsights.map(i => i.toLowerCase());
    if (loweredAreaInsights.some(i => i.includes('crepes'))) {
      localTrend = 'crepes';
    }
    // You could add more logic to detect other trends similarly

    // Build a robust, self-contained user prompt
    const prompt = `
Below is context about a restaurant, including its latest Google-based market/search insights and menu analysis data. Please provide a "master recommendation" that does the following:
1. Clearly references the star rating, top dish(es), and any major customer remarks from the market search.
2. Leverages the menu analysis insights on structure, design, pricing, color, psychology, engineering, and customer experience.
3. Details actionable, specific changes to the menu (layout, dish placement, pricing strategy, descriptive copy, etc.) that align with local preferences and the identified local trend.
4. Offers a plan to increase the overall restaurant rating, enhance customer satisfaction, and address any pain points mentioned in the area insights.
5. Explains **why** each recommendation is made by explicitly referencing the dish insights and area insights.

===============
RESTAURANT SEARCH INFO
- Restaurant Name: ${search.restaurant_name || 'Unknown'}
- Search/Market Data Date: ${new Date(search.created_at).toLocaleDateString()}
- Star Rating: ${search.star_rating || 'N/A'}

AREA INSIGHTS (Top 10):
${areaInsights.slice(0, 10).map(i => '- ' + i).join('\n') || 'No area insights available.'}

===============
MENU ANALYSIS INFO
- Analysis Date: ${new Date(analysis.created_at).toLocaleDateString()}
- Key Menu Design & Psychology Insights: 
  - ${analysis.structure_insights || 'N/A'}
  - ${analysis.design_insights || 'N/A'}
  - ${analysis.pricing_insights || 'N/A'}
  - ${analysis.color_insights || 'N/A'}
  - ${analysis.psychology_insights || 'N/A'}
  - ${analysis.engineering_insights || 'N/A'}
  - ${analysis.customer_experience_insights || 'N/A'}

DISH INSIGHTS (Top 10):
${dishInsights.slice(0, 20).map(i => '- ' + i).join('\n') || 'No dish insights available.'}

===============
KEY OBSERVATIONS
1. Customers have expressed a strong preference for: ${localTrend}
2. Notable customer remark: "${areaInsights[0] || 'No notable remarks found.'}"
3. Top-performing dish (per menu analysis): "${dishInsights[0] || 'N/A'}"

===============
ADDITIONAL CONTEXT
${customContext || 'No additional context provided.'}

===============
TASK
Based on all of the above data, provide a comprehensive recommendation that:
- Optimizes the menu structure and design to highlight key dishes and local trends.
- Explains how/why the recommendation aligns with the dish insights, the area insights, and the psychological/pricing strategies mentioned.
- Suggests an overall improvement plan to boost the restaurant's rating and address any potential gaps in customer experience.

End your response with a concise summary of your plan.

`.trim();

    console.log("Master Recommendation Prompt:", prompt);

    // Send the assembled prompt to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a master menu optimization consultant with expertise in local market trends, restaurant management, and menu engineering. Provide detailed, actionable recommendations tailored to the given context, and always explain *why* you make each recommendation based on the data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const masterRecommendation = response.choices[0].message.content;
    console.log("Master Recommendation:", masterRecommendation);

    console.log("Raw dish insights:", analysis.dish_insights);
    console.log("Processed dish insights array:", dishInsights);

    return new Response(JSON.stringify({ masterRecommendation }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error generating master recommendation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
