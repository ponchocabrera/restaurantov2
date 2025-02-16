import { query } from '@/lib/db';

export async function saveMenuAnalysis(userId, analysis, imageData, recommendations = null) {
  const sql = `
    INSERT INTO menu_analysis (user_id, analysis, image_data, recommendations)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;
  const values = [userId, analysis, imageData, recommendations];
  try {
    const res = await query(sql, values);
    console.log('Full analysisText:', analysis);
    return res.rows[0];
  } catch (error) {
    console.error('Error saving menu analysis:', error);
    throw error;
  }
}

export async function updateMenuAnalysisRecommendations(analysisId, recommendations) {
  const sql = `
    UPDATE menu_analysis
    SET recommendations = $1
    WHERE id = $2
    RETURNING *
  `;
  const values = [recommendations, analysisId];
  try {
    const res = await query(sql, values);
    console.log('Updated recommendations for analysis ID:', analysisId);
    return res.rows[0];
  } catch (error) {
    console.error('Error updating recommendations:', error);
    throw error;
  }
}

export async function getMenuAnalysis(userId) {
  const sql = `
    SELECT *
    FROM menu_analysis
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const values = [userId];
  try {
    const res = await query(sql, values);
    return res.rows;
  } catch (error) {
    console.error('Error fetching menu analysis:', error);
    throw error;
  }
}

function extractSection(text, sectionName) {
  if (!text || typeof text !== 'string') {
    console.error(`Invalid text for section ${sectionName}:`, text);
    return [];
  }
  try {
    const sectionRegex = new RegExp(`${sectionName}:[\\s\\S]*?(?=(?:[A-Z]+:)|$)`);
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

export { extractSection };

export async function saveRestaurantSearch(userId, restaurantName, starRating, position, dishInsights, areaInsights) {
  const sql = `
    INSERT INTO restaurant_searches (user_id, restaurant_name, star_rating, position, dish_insights, area_insights)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, user_id, restaurant_name, star_rating, position, dish_insights, area_insights, created_at
  `;
  const values = [userId, restaurantName, starRating, position, dishInsights, areaInsights];
  try {
    const res = await query(sql, values);
    return res.rows[0];
  } catch (error) {
    console.error("Error saving restaurant search:", error);
    throw error;
  }
}