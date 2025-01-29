// [D] pages/api/restaurantsProfile/[id].js or app/api/restaurantsProfile/[id]/route.js
import { pool } from '../../../lib/db'; // or correct path

export default async function handler(req, res) {
  const { id } = req.query; // or params if app router
  if (req.method === 'PUT') {
    try {
      const { data, colorPalette } = req.body;
      const sql = `
        UPDATE restaurants_profile
        SET data = $1,
            color_palette = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING id, data, color_palette
      `;

      const result = await pool.query(sql, [data, colorPalette, id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      return res.status(200).json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
