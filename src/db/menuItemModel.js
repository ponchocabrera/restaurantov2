// [5] Menu Item Model or DB Access

async function getMenuItems() {
    try {
      // Replace with real DB logic (SQL, Mongo, etc.)
      // Example mock data:
      return [
        {
          id: 1,
          name: 'Pasta Carbonara',
          price: 12.99,
          popularity: 8,
          bestSeller: true,
          margins: 'high',
        },
        {
          id: 2,
          name: 'Margherita Pizza',
          price: 10.99,
          popularity: 9,
          bestSeller: false,
          margins: 'medium',
        }
      ];
    } catch (err) {
      console.error('[getMenuItems] Error:', err);
      throw err;
    }
  }
  
  module.exports = { getMenuItems };
  