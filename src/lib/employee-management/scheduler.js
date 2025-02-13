import { query } from '@/lib/db';

/**
 * Fetch employees with their roles and availability.
 */
export async function getEmployeesWithAvailability(restaurantId) {
  const result = await query(
    `
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      ARRAY_AGG(DISTINCT er.role) AS roles,
      json_agg(
        json_build_object(
          'day_of_week', ea.day_of_week,
          'start_time', ea.start_time,
          'end_time', ea.end_time,
          'can_work', ea.can_work
        )
      ) AS availability
    FROM employees e
    LEFT JOIN employee_roles er ON e.id = er.employee_id
    LEFT JOIN employee_availability ea ON e.id = ea.employee_id
    WHERE e.restaurant_id = $1
    GROUP BY e.id
    `,
    [restaurantId]
  );

  // Filter out any availability entries that may be null
  return result.rows.map(emp => ({
    ...emp,
    availability: emp.availability.filter(av => av.day_of_week)
  }));
}

/**
 * Fetch zones with their staffing requirements.
 */
export async function getZonesWithRequirements(restaurantId) {
  const result = await query(
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
      ) AS requirements
    FROM restaurant_zones z
    LEFT JOIN zone_roles_needed zr ON z.id = zr.zone_id
    WHERE z.restaurant_id = $1
    GROUP BY z.id
    `,
    [restaurantId]
  );

  return result.rows.map(zone => ({
    ...zone,
    requirements: zone.requirements.filter(req => req.day_of_week)
  }));
}

/**
 * Generate a schedule for a given user (by their restaurant) and date range.
 */
export async function generateSchedule(userId, startDate, endDate) {
  // 1. Get restaurant ID for the given user
  const restaurantRes = await query(
    'SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  if (!restaurantRes.rows.length) {
    throw new Error('Restaurant not found');
  }
  const restaurantId = restaurantRes.rows[0].id;

  // 2. Load employees and zones concurrently
  const [employees, zones] = await Promise.all([
    getEmployeesWithAvailability(restaurantId),
    getZonesWithRequirements(restaurantId)
  ]);

  // 3. Initialize the schedule and an assignment counter for fairness
  const schedule = [];
  const assignments = {};
  employees.forEach(emp => (assignments[emp.id] = 0));

  // 4. Loop through each day in the given date range
  let currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);
  while (currentDate <= endDateObj) {
    const dateString = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Loop through zones and their requirements for the day
    zones.forEach(zone => {
      const zoneRequirements = zone.requirements.filter(
        req => req.day_of_week === dayOfWeek
      );
      zoneRequirements.forEach(requirement => {
        // Find employees who have the required role and are available during the shift
        const availableEmployees = employees.filter(emp => {
          const hasRole = emp.roles.includes(requirement.role);
          const isAvailable = emp.availability.some(av =>
            av.day_of_week === dayOfWeek &&
            av.can_work &&
            av.start_time <= requirement.shift_start &&
            av.end_time >= requirement.shift_end
          );
          return hasRole && isAvailable;
        });

        // Sort by the number of assignments (to promote fairness)
        availableEmployees.sort((a, b) => assignments[a.id] - assignments[b.id]);

        // Assign employees up to the required count
        const assignCount = Math.min(requirement.required_count, availableEmployees.length);
        for (let i = 0; i < assignCount; i++) {
          const employee = availableEmployees[i];
          schedule.push({
            employee_id: employee.id,
            zone_id: zone.id,
            shift_date: dateString,
            start_time: requirement.shift_start,
            end_time: requirement.shift_end,
            role: requirement.role,
            status: 'scheduled'
          });
          assignments[employee.id]++; // update assignment count
        }
      });
    });

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { schedule };
}
