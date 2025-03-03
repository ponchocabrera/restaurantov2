import { query } from '@/lib/db';
import { getRestaurantDetails, getNearbyRestaurants, getAreaReviewSummary } from '@/lib/restaurant-insights';

/**
 * Checks for changes in a restaurant's zone by comparing the latest search with fresh data
 */
export async function checkZoneChanges(userId, restaurantName, placeId) {
  try {
    // Get the latest search for this restaurant
    const latestSearchResult = await query(
      `SELECT * FROM restaurant_searches 
       WHERE user_id = $1 AND restaurant_name = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [userId, restaurantName]
    );
    
    if (latestSearchResult.rows.length === 0) {
      console.log(`No previous search found for restaurant ${restaurantName}`);
      return null;
    }
    
    const latestSearch = latestSearchResult.rows[0];
    
    // Fetch current restaurant details
    const restaurant = await getRestaurantDetails(placeId);
    
    // Get nearby restaurants
    const nearbyRestaurants = await getNearbyRestaurants(
      restaurant.geometry.location.lat,
      restaurant.geometry.location.lng
    );
    
    // Generate area review summary
    const areaReviewSummary = await getAreaReviewSummary(nearbyRestaurants);
    
    // Calculate current ranking
    const restaurantRating = restaurant.rating;
    const nearbyRatings = nearbyRestaurants.map(r => r.rating).filter(r => r != null);
    const allRatings = [...nearbyRatings, restaurantRating].sort((a, b) => b - a);
    const currentRank = allRatings.indexOf(restaurantRating) + 1;
    
    // Detect changes
    const changes = {
      ratingChanged: Math.abs(restaurant.rating - latestSearch.star_rating) >= 0.1,
      rankChanged: currentRank !== latestSearch.position,
      areaInsightsChanged: areaReviewSummary !== latestSearch.area_insights,
      newRating: restaurant.rating,
      oldRating: latestSearch.star_rating,
      newRank: currentRank,
      oldRank: latestSearch.position,
      areaInsights: areaReviewSummary,
      oldAreaInsights: latestSearch.area_insights,
      hasSignificantChanges: false
    };
    
    // Determine if changes are significant
    if (
      Math.abs(restaurant.rating - latestSearch.star_rating) >= 0.2 || // Rating changed by 0.2 or more
      Math.abs(currentRank - latestSearch.position) >= 2 || // Rank changed by 2 or more positions
      areaReviewSummary !== latestSearch.area_insights // Area insights changed
    ) {
      changes.hasSignificantChanges = true;
      
      // Save the new search result to update our records
      await query(
        `INSERT INTO restaurant_searches 
         (user_id, restaurant_name, star_rating, position, dish_insights, area_insights, is_auto_update)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          userId, 
          restaurantName, 
          restaurant.rating, 
          currentRank, 
          latestSearch.dish_insights, // Keep the same dish insights
          areaReviewSummary,
          true // Mark this as an automatic update
        ]
      );
    }
    
    return changes;
  } catch (error) {
    console.error(`Error checking zone changes for ${restaurantName}:`, error);
    return null;
  }
}

/**
 * Get all restaurants that need monitoring (those with at least one search)
 */
export async function getRestaurantsToMonitor() {
  try {
    const result = await query(`
      SELECT DISTINCT ON (user_id, restaurant_name) 
        user_id, restaurant_name, place_id
      FROM restaurant_searches rs
      JOIN restaurants r ON rs.restaurant_name = r.name
      ORDER BY user_id, restaurant_name, rs.created_at DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error getting restaurants to monitor:', error);
    return [];
  }
}

/**
 * Get recent zone updates for a user
 */
export async function getRecentZoneUpdates(userId, limit = 5) {
  try {
    const result = await query(`
      SELECT * FROM restaurant_searches
      WHERE user_id = $1 AND is_auto_update = true
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting recent zone updates:', error);
    return [];
  }
} 