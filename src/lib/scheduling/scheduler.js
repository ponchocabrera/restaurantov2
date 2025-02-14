// File: src/lib/scheduling/scheduler.js

import { query } from '@/lib/db';

/**
 * Converts any day input (full name or abbreviated, any case)
 * to a standardized abbreviated form ("Mon", "Tue", etc.).
 */
function toAbbreviated(day) {
  if (!day) return day;
  const d = day.toLowerCase().trim();
  switch (d) {
    case 'monday':
    case 'mon':
      return 'Mon';
    case 'tuesday':
    case 'tue':
    case 'tues':
      return 'Tue';
    case 'wednesday':
    case 'wed':
      return 'Wed';
    case 'thursday':
    case 'thu':
    case 'thurs':
      return 'Thu';
    case 'friday':
    case 'fri':
      return 'Fri';
    case 'saturday':
    case 'sat':
      return 'Sat';
    case 'sunday':
    case 'sun':
      return 'Sun';
    default:
      return day;
  }
}

/**
 * Force local noon to avoid timezone issues.
 */
function toLocalNoon(dateObj) {
  const dateStr = dateObj.toISOString().split('T')[0];
  return new Date(`${dateStr}T12:00:00`);
}

/**
 * Check if two time ranges overlap.
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

  return sA < eB && sB < eA;
}

/**
 * All days abbreviated.
 */
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Load employees from your DB.
 * Updated to select "e.first_name" as the employee's name.
 */
async function getEmployees(restaurantId) {
  const result = await query(
    `
    SELECT
      e.id,
      e.first_name as name,  -- Adjusted: using first_name as the employee name.
      array_agg(DISTINCT er.role) AS roles,
      e.rest_days,
      e.days_per_week
    FROM employees e
    LEFT JOIN employee_roles er ON e.id = er.employee_id
    WHERE e.restaurant_id = $1
    GROUP BY e.id, e.first_name, e.rest_days, e.days_per_week
    `,
    [restaurantId]
  );

  return result.rows.map(row => {
    // Normalize rest_days to abbreviated names.
    const restDays = (row.rest_days || []).map(day => toAbbreviated(day));
    const normalDays = ALL_DAYS.filter(day => !restDays.includes(day));
    const coverDays = []; // (adjust if you add cover day logic)
    return {
      id: row.id,
      name: row.name, // Employee name from first_name
      roles: (row.roles || []).map(role => role.toLowerCase()),
      restDays,
      normalDays,
      coverDays,
      daysPerWeek: row.days_per_week
    };
  });
}

/**
 * Load zones and their requirements.
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
    // Filter only valid requirements.
    requirements: (z.requirements || []).filter(r => r.day_of_week && r.required_count > 0)
  }));
}

/**
 * Main scheduling function.
 */
export async function generateSchedule(userId, startDate, endDate) {
  // 1) Retrieve restaurant by userId.
  const restaurantRes = await query(
    'SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  if (!restaurantRes.rows.length) {
    throw new Error('Restaurant not found');
  }
  const restaurantId = restaurantRes.rows[0].id;

  // 2) Load employees and zones concurrently.
  const [employees, zones] = await Promise.all([
    getEmployees(restaurantId),
    getZones(restaurantId)
  ]);

  console.log('DEBUG: Employees:', employees);
  console.log('DEBUG: Zones:', zones.map(z => ({
    id: z.id,
    name: z.name,
    requirements: z.requirements.map(r => r.day_of_week)
  })));

  const schedule = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const midday = toLocalNoon(current);
    // Use abbreviated weekday format.
    const dayOfWeek = midday.toLocaleDateString('en-US', { weekday: 'short' });
    const dateString = midday.toISOString().split('T')[0];

    console.log(`DEBUG: Processing ${dateString} (${dayOfWeek})`);

    // For each zone, find requirements matching this day.
    for (const zone of zones) {
      const zoneRequirements = zone.requirements.filter(r => {
        const dbDay = toAbbreviated(r.day_of_week);
        return dbDay === dayOfWeek;
      });

      console.log(
        `DEBUG: Zone "${zone.name}" raw days:`,
        zone.requirements.map(r => r.day_of_week)
      );
      console.log(
        `DEBUG: Zone "${zone.name}" normalized for ${dayOfWeek}:`,
        zoneRequirements.map(r => toAbbreviated(r.day_of_week))
      );

      for (const req of zoneRequirements) {
        let slotsRemaining = req.required_count;

        // Pass A: normalDays
        let normalCandidates = employees.filter(emp => {
          if (!emp.roles.includes(req.role.toLowerCase())) return false;
          if (emp.restDays.includes(dayOfWeek)) return false;
          if (!emp.normalDays.includes(dayOfWeek)) return false;
          const alreadyAssigned = schedule.some(shift =>
            shift.employee_id === emp.id &&
            shift.shift_date === dateString &&
            timesOverlap(shift.start_time, shift.end_time, req.shift_start, req.shift_end)
          );
          return !alreadyAssigned;
        });

        normalCandidates.sort((a, b) => {
          const aCount = schedule.filter(s => s.employee_id === a.id).length;
          const bCount = schedule.filter(s => s.employee_id === b.id).length;
          return aCount - bCount;
        });

        // Create shifts and include the employee's name.
        for (let i = 0; i < normalCandidates.length && slotsRemaining > 0; i++) {
          schedule.push({
            employee_id: normalCandidates[i].id,
            employee_name: normalCandidates[i].name, // Include employee's name
            zone_id: zone.id,
            shift_date: dateString,
            start_time: req.shift_start,
            end_time: req.shift_end,
            role: req.role,
            status: 'scheduled'
          });
          slotsRemaining--;
        }

        // Pass B: coverDays (if needed)
        if (slotsRemaining > 0) {
          let coverCandidates = employees.filter(emp => {
            if (!emp.roles.includes(req.role.toLowerCase())) return false;
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
              employee_name: coverCandidates[i].name, // Include employee's name
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
      }
    }

    current.setDate(current.getDate() + 1);
  }

  console.log('DEBUG: Final schedule:', schedule);

  return { schedule };
}
