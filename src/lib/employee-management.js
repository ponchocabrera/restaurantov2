export async function updateShiftPreferences(employeeId, preferences) {
    await query('BEGIN');
    
    // Clear existing preferences
    await query(
      'DELETE FROM employee_shift_preferences WHERE employee_id = $1',
      [employeeId]
    );
  
    // Insert new preferences
    for (const pref of preferences) {
      await query(
        `INSERT INTO employee_shift_preferences 
         (employee_id, shift_type, preferred)
         VALUES ($1, $2, $3)`,
        [employeeId, pref.shift_type, pref.preferred]
      );
    }
  
    await query('COMMIT');
  }