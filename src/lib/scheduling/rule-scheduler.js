import { query } from '@/lib/db';

export async function generateSchedule(restaurantId, startDate, endDate) {
  // 1. Get all data
  const [employees, zones, preferences] = await Promise.all([
    getEmployeeAvailability(restaurantId),
    getZoneRequirements(restaurantId),
    getEmployeePreferences(restaurantId)
  ]);

  // 2. Generate schedule using rules
  const schedule = [];
  const currentDate = new Date(startDate);
  const endDateTime = new Date(endDate);

  while (currentDate <= endDateTime) {
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Sort employees by hours worked (fair distribution)
    const sortedEmployees = employees.sort((a, b) => 
      (a.hours_worked || 0) - (b.hours_worked || 0)
    );

    // For each zone and time slot
    for (const zone of zones) {
      const requirements = zone.roles_needed.filter(r => r.day_of_week === dayOfWeek);
      
      for (const req of requirements) {
        const availableEmployees = sortedEmployees.filter(emp => 
          isEmployeeAvailable(emp, dayOfWeek, req) && 
          hasRequiredRole(emp, req.role) &&
          !isOverworked(emp)
        );

        // Assign shifts
        for (let i = 0; i < req.required_count; i++) {
          if (availableEmployees[i]) {
            schedule.push(createShift(
              availableEmployees[i],
              zone,
              currentDate,
              req
            ));
          }
        }
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
} 