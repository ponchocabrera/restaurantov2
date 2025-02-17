import OpenAI from 'openai';
import { getLatestMenuAnalysis, getLatestRestaurantSearch } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const { customContext, restaurantName } = await request.json().catch(() => ({}));
    if (!restaurantName) {
      throw new Error("Restaurant name not provided.");
    }

    // Fetch data from the database
    const analysis = await getLatestMenuAnalysis(session.user.id);
    const search = await getLatestRestaurantSearch(session.user.id, restaurantName);

    // Log for debugging
    console.log("Menu Analysis:", analysis);
    console.log("Restaurant Search:", search);

    // Provide descriptive errors based on which record is missing.
    if (!analysis || !search) {
      if (!analysis && search) {
        console.error("No Menu Analysis data found for", restaurantName);
        throw new Error("Missing menu analysis data. Please create a menu analysis for '" + restaurantName + "' before generating recommendations.");
      } else if (analysis && !search) {
        console.error("No Restaurant Search data found for", restaurantName);
        throw new Error("Missing restaurant search data. Please perform a restaurant search for '" + restaurantName + "' before generating recommendations.");
      } else {
        console.error("No Menu Analysis and Restaurant Search data found for", restaurantName);
        throw new Error("Missing both menu analysis and restaurant search data for '" + restaurantName + "'. Please create them before generating recommendations.");
      }
    }

    // Proceed with processing dish insights since both records are available
    const dishInsightsFromSearch =
      typeof search.dish_insights === 'string'
        ? search.dish_insights.split('\n').map(line => line.trim()).filter(Boolean)
        : (search.dish_insights || []);
    const dishInsightsFromAnalysis =
      typeof analysis.dish_insights === 'string'
        ? analysis.dish_insights.split('\n').map(line => line.trim()).filter(Boolean)
        : (analysis.dish_insights || []);
    const dishInsights = [...dishInsightsFromSearch, ...dishInsightsFromAnalysis].filter(Boolean);

    // Process area insights (ensure array)
    const areaInsights =
      typeof search.area_insights === 'string'
        ? search.area_insights.split('\n').map(line => line.trim()).filter(Boolean)
        : (search.area_insights || []);
    
    // Identify a local trend (this example simply checks for "crepes")
    let localTrend = 'your popular dishes';
    const loweredAreaInsights = areaInsights.map(i => i.toLowerCase());
    if (loweredAreaInsights.some(i => i.includes('crepes'))) {
      localTrend = 'crepes';
    }

    // Build four individual prompts:

    // 1. Recommendation based on star dishes & menu analysis improvements.
    const promptStarDishes = `
Below is context about a restaurant with market search insights and menu analysis data.
RESTAURANT SEARCH INFO:
- Restaurant Name: ${search.restaurant_name || 'Unknown'}
- Search Date: ${new Date(search.created_at).toLocaleDateString()}
- Star Rating: ${search.star_rating || 'N/A'}

MENU ANALYSIS INFO:
- Top-performing dish (per menu analysis): "${dishInsights[0] || 'N/A'}"

TASK:
Provide a recommendation that highlights the star dish and explains how to incorporate it into the menu.
Include actionable steps for menu placement, descriptive copy, and design improvements. Explain why these recommendations are beneficial.
${customContext ? `Additional Context: ${customContext}` : ''}
    `.trim();

    // 2. Recommendation based on dish-specific insights and menu engineering.
    const promptDishInsights = `
DISH INSIGHTS:
${dishInsights.slice(0, 20).map(i => '- ' + i).join('\n') || 'No dish insights available.'}

MENU ANALYSIS IMPROVEMENTS:
- Structure: ${analysis.structure_insights || 'N/A'}
- Design: ${analysis.design_insights || 'N/A'}
- Pricing: ${analysis.pricing_insights || 'N/A'}
- Customer Experience: ${analysis.customer_experience_insights || 'N/A'}

TASK:
Provide a detailed recommendation focusing on dish-specific improvements.
Outline actionable changes based on menu engineering principles and enhanced dish descriptions. Explain your reasoning.
    `.trim();

    // 3. Recommendation for overall areas of opportunity based on area insights.
    const promptAreaOpportunities = `
RESTAURANT SEARCH INFO:
- Restaurant Name: ${search.restaurant_name || 'Unknown'}
- Search Date: ${new Date(search.created_at).toLocaleDateString()}
- Star Rating: ${search.star_rating || 'N/A'}

AREA INSIGHTS:
${areaInsights.slice(0, 10).map(i => '- ' + i).join('\n') || 'No area insights available.'}

TASK:
Offer recommendations focusing on the overall areas of opportunity.
Include actionable suggestions that address potential improvements in service, ambiance, and customer satisfaction. Explain why these changes can boost the restaurant's performance.
    `.trim();

    // 4. Recommendation leveraging local food trends.
    const promptLocalTrends = `
Local Trend:
- Identified Trend: ${localTrend}

TASK:
Provide a recommendation that leverages this local food trend.
Explain how incorporating the trend can influence customer preferences and drive menu adjustments.
Include specific, actionable suggestions and your reasoning.
    `.trim();

    // Function to generate a recommendation for a given prompt.
    async function generateRecommendation(prompt, retries = 3) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a master menu optimization consultant. Provide detailed, actionable recommendations and always explain why each recommendation is made based on the provided data."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000
        });
        return response.choices[0].message.content;
      } catch (error) {
        if (error.status === 429 && retries > 0) {
          // Wait for 1 second and retry.
          console.warn(`Rate limit hit. Retrying in 1000ms... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await generateRecommendation(prompt, retries - 1);
        }
        throw error; // Re-throw if not a rate limit error or no retries remain.
      }
    }

    // Instead of Promise.all, run the prompts sequentially.
    const starDishRecommendation = await generateRecommendation(promptStarDishes);
    const dishInsightsRecommendation = await generateRecommendation(promptDishInsights);
    const areaOpportunityRecommendation = await generateRecommendation(promptAreaOpportunities);
    const localTrendRecommendation = await generateRecommendation(promptLocalTrends);

    // Combine recommendations into an object.
    const masterRecommendations = {
      starDishRecommendation,
      dishInsightsRecommendation,
      areaOpportunityRecommendation,
      localTrendRecommendation
    };

    console.log("Master Recommendations:", masterRecommendations);

    return new Response(JSON.stringify(masterRecommendations), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error generating master recommendations:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
