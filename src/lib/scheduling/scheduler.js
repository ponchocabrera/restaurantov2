// File: src/lib/scheduling/scheduler.js

import { query } from '@/lib/db';

/**
 * 1. Force local noon to avoid Monday -> Sunday shift from time zone.
 */
function toLocalNoon(dateObj) {
  const dateStr = dateObj.toISOString().split('T')[0]; // "YYYY-MM-DD"
  return new Date(`${dateStr}T12:00:00`);
}

/**
 * 2. Detect time overlap between (startA, endA) and (startB, endB).
 */
function timesOverlap(startA, endA, startB, endB) {
  const [hA1, mA1] = startA.split(':').map(Number);
  const [hA2, mA2] = endA.split(':').map(Number);
  const [hB1, mB1] = startB.split(':').map(Number);
  const [hB2, mB2] = endB.split(':').map(Number);

  const sA = hA1 * 60 + mA1;
  const eA = hA2 * 60 + mA2;
  const sB = hB1 * 60 + mB1;
  const eB = hB2 * 60 + mB2;

  return (sA < eB) && (sB < eA);
}

/**
 * We'll treat these as the full week. 
 * We then derive `normalDays` by subtracting `restDays` from this list.
 */
const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

/**
 * 3. Load employees from your DB, 
 *    reading `rest_days` directly, and deriving `normalDays`.
 *
 *    Your table already has:
 *    - id
 *    - rest_days (array)
 *    - days_per_week (int)
 *    plus a join to employee_roles if needed.
 */
async function getEmployees(restaurantId) {
  // Example query that:
  //  - selects e.id
  //  - aggregates roles
  //  - includes e.rest_days (which you do have)
  //  - includes e.days_per_week if you want
  const result = await query(
    `
    SELECT
      e.id,
      array_agg(DISTINCT er.role) AS roles,
      e.rest_days,
      e.days_per_week
    FROM employees e
    LEFT JOIN employee_roles er ON e.id = er.employee_id
    WHERE e.restaurant_id = $1
    GROUP BY e.id, e.rest_days, e.days_per_week
    `,
    [restaurantId]
  );

  // For each row:
  // rest_days is from your DB. 
  // normalDays = ALL_DAYS - rest_days
  // coverDays is empty (or you can define logic if needed).
  return result.rows.map(row => {
    const restDays = row.rest_days || [];
    const normalDays = ALL_DAYS.filter(day => !restDays.includes(day));
    const coverDays = []; // Currently not used unless you have a separate concept.

    return {
      id: row.id,
      roles: row.roles || [],
      restDays,
      normalDays,
      coverDays,
      daysPerWeek: row.days_per_week
    };
  });
}

/**
 * 4. Load zones and their requirements. 
 *    e.g. from zone_roles_needed, 
 *    each requirement has day_of_week, role, required_count, shift_start, shift_end
 */
async function getZones(restaurantId) {
  const zonesRes = await query(
    `
    SELECT 
      z.id,
      z.name,
      json_agg(
        json_build_object(
          'day_of_week', zr.day_of_week,
          'role', zr.role,
          'required_count', zr.required_count,
          'shift_start', zr.shift_start,
          'shift_end', zr.shift_end
        )
      ) as requirements
    FROM restaurant_zones z
    LEFT JOIN zone_roles_needed zr ON z.id = zr.zone_id
    WHERE z.restaurant_id = $1
    GROUP BY z.id
    `,
    [restaurantId]
  );

  return zonesRes.rows.map(z => ({
    id: z.id,
    name: z.name,
    requirements: (z.requirements || []).filter(r => r.day_of_week),
  }));
}

/**
 * 5. The scheduling function 
 *    that uses normalDays vs restDays
 *    plus a basic second pass for coverDays 
 *    (empty here, but you can fill if needed).
 */
export async function generateSchedule(userId, startDate, endDate) {
  // 1) find the user’s restaurant
  const restaurantRes = await query('SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1', [userId]);
  if (!restaurantRes.rows.length) {
    throw new Error('Restaurant not found');
  }
  const restaurantId = restaurantRes.rows[0].id;

  // 2) load employees & zones
  const [employees, zones] = await Promise.all([
    getEmployees(restaurantId),
    getZones(restaurantId)
  ]);

  const schedule = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const midday = toLocalNoon(current);
    const dayOfWeek = midday.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = midday.toISOString().split('T')[0];

    // For each zone, find requirements for this day
    for (const zone of zones) {
      const zoneRequirements = zone.requirements.filter(r => r.day_of_week === dayOfWeek);

      for (const req of zoneRequirements) {
        let slotsRemaining = req.required_count;

        // Pass A: normalDays 
        let normalCandidates = employees.filter(emp => {
          if (!emp.roles.includes(req.role)) return false;
          if (emp.restDays.includes(dayOfWeek)) return false;
          if (!emp.normalDays.includes(dayOfWeek)) return false;

          // check if already assigned overlapping
          const alreadyAssigned = schedule.some(shift =>
            shift.employee_id === emp.id &&
            shift.shift_date === dateString &&
            timesOverlap(shift.start_time, shift.end_time, req.shift_start, req.shift_end)
          );
          return !alreadyAssigned;
        });

        // optional fairness sort
        normalCandidates.sort((a, b) => {
          const aCount = schedule.filter(s => s.employee_id === a.id).length;
          const bCount = schedule.filter(s => s.employee_id === b.id).length;
          return aCount - bCount;
        });

        for (let i = 0; i < normalCandidates.length && slotsRemaining > 0; i++) {
          schedule.push({
            employee_id: normalCandidates[i].id,
            zone_id: zone.id,
            shift_date: dateString,
            start_time: req.shift_start,
            end_time: req.shift_end,
            role: req.role,
            status: 'scheduled'
          });
          slotsRemaining--;
        }

        // Pass B: coverDays
        // (currently empty, but let's keep the logic for completeness)
        if (slotsRemaining > 0) {
          let coverCandidates = employees.filter(emp => {
            if (!emp.roles.includes(req.role)) return false;
            if (emp.restDays.includes(dayOfWeek)) return false;
            if (!emp.coverDays.includes(dayOfWeek)) return false;

            const alreadyAssigned = schedule.some(shift =>
              shift.employee_id === emp.id &&
              shift.shift_date === dateString &&
              timesOverlap(shift.start_time, shift.end_time, req.shift_start, req.shift_end)
            );
            return !alreadyAssigned;
          });

          coverCandidates.sort((a, b) => {
            const aCount = schedule.filter(s => s.employee_id === a.id).length;
            const bCount = schedule.filter(s => s.employee_id === b.id).length;
            return aCount - bCount;
          });

          for (let i = 0; i < coverCandidates.length && slotsRemaining > 0; i++) {
            schedule.push({
              employee_id: coverCandidates[i].id,
              zone_id: zone.id,
              shift_date: dateString,
              start_time: req.shift_start,
              end_time: req.shift_end,
              role: req.role,
              status: 'scheduled'
            });
            slotsRemaining--;
          }
        }

        // If you want a third pass that uses restDays, add it here if needed.
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return { schedule };
}
