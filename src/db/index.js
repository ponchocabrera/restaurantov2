import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://alfonsocabrera:YOUR_PASSWORD@localhost:5432/restaurantos_dev'
});

client.connect();

export async function saveMenuAnalysis(userId, analysis, imageData, recommendations = null) {
  const query = `
    INSERT INTO menu_analysis (user_id, analysis, image_data, recommendations)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;
  const values = [userId, analysis, imageData, recommendations];
  try {
    const res = await client.query(query, values);
    console.log('Full analysisText:', analysis);
    return res.rows[0];
  } catch (error) {
    console.error('Error saving menu analysis:', error);
    throw error;
  }
}

export async function updateMenuAnalysisRecommendations(analysisId, recommendations) {
  const query = `
    UPDATE menu_analysis
    SET recommendations = $1
    WHERE id = $2
    RETURNING *
  `;
  const values = [recommendations, analysisId];
  try {
    const res = await client.query(query, values);
    console.log('Updated recommendations for analysis ID:', analysisId);
    return res.rows[0];
  } catch (error) {
    console.error('Error updating recommendations:', error);
    throw error;
  }
}

// New function to fetch analysis records for a given user
export async function getMenuAnalysis(userId) {
  const query = `
    SELECT *
    FROM menu_analysis
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const values = [userId];
  try {
    const res = await client.query(query, values);
    return res.rows;
  } catch (error) {
    console.error("Error fetching menu analysis:", error);
    throw error;
  }
}

function extractSection(text, sectionName) {
  if (!text || typeof text !== 'string') {
    console.error(`Invalid text for section ${sectionName}:`, text);
    return [];
  }

  try {
    // This regex looks for the section name followed by a colon,
    // then captures everything up to the next section (which is assumed to be all-caps and ends with a colon)
    // or the end of the string.
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