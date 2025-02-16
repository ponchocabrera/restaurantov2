import { Pool } from 'pg';

const pool = new Pool({
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

export async function getLatestMenuAnalysis() {
  const query = 'SELECT * FROM menu_analysis ORDER BY created_at DESC LIMIT 1';
  const { rows } = await pool.query(query);
  return rows[0];
}

export async function getLatestRestaurantSearch() {
  const query = 'SELECT * FROM restaurant_searches ORDER BY created_at DESC LIMIT 1';
  const { rows } = await pool.query(query);
  return rows[0];
}

export default pool;
