import { Pool } from 'pg';

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Optional: Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

export const query = (text, params) => pool.query(text, params);

export async function getLatestMenuAnalysis(userId) {
  const queryText = `
    SELECT *
    FROM menu_analysis
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(queryText, [userId]);
  return rows[0];
}

export async function getLatestRestaurantSearch(userId, restaurantName) {
  const queryText = `
    SELECT *
    FROM restaurant_searches
    WHERE user_id = $1 AND restaurant_name = $2
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(queryText, [userId, restaurantName]);
  return rows[0];
}
