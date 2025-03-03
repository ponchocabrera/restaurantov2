import cron from 'node-cron';
import { getRestaurantsToMonitor, checkZoneChanges } from '@/lib/zone-monitoring';
import { sendZoneUpdateEmail } from '@/lib/notifications/email';
import { query } from '@/lib/db';

/**
 * Run zone monitoring for all restaurants
 */
export async function runZoneMonitoring() {
  try {
    console.log('Starting weekly zone monitoring...');
    
    // Get all restaurants that need monitoring
    const restaurants = await getRestaurantsToMonitor();
    console.log(`Found ${restaurants.length} restaurants to monitor`);
    
    for (const restaurant of restaurants) {
      try {
        console.log(`Checking zone changes for ${restaurant.restaurant_name}`);
        
        const changes = await checkZoneChanges(
          restaurant.user_id,
          restaurant.restaurant_name,
          restaurant.place_id
        );
        
        if (changes && changes.hasSignificantChanges) {
          console.log(`Significant changes detected for ${restaurant.restaurant_name}`);
          
          // Get user email for notification
          const userResult = await query(
            'SELECT email FROM users WHERE id = $1',
            [restaurant.user_id]
          );
          
          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            // Send notification email
            await sendZoneUpdateEmail(
              user.email,
              restaurant.restaurant_name,
              changes
            );
          }
        }
      } catch (error) {
        console.error(`Error monitoring ${restaurant.restaurant_name}:`, error);
        // Continue with next restaurant
      }
    }
    
    console.log('Zone monitoring completed');
  } catch (error) {
    console.error('Error running zone monitoring:', error);
  }
}

/**
 * Schedule the zone monitoring job to run weekly (every Monday at 3 AM)
 */
export function scheduleZoneMonitoring() {
  cron.schedule('0 3 * * 1', () => {
    runZoneMonitoring();
  });
  
  console.log('Zone monitoring scheduled for every Monday at 3 AM');
} 