import React, { useState, useEffect } from 'react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Updated helper to convert full day names to abbreviated versions.
// This version handles lowercase day names.
const abbreviateDay = (day) => {
  const map = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  };
  return map[day.toLowerCase()] || day;
};

const ZoneFillingStatus = ({ schedule }) => {
  const [zoneRequirements, setZoneRequirements] = useState([]);

  useEffect(() => {
    async function fetchZoneRequirements() {
      try {
        // Use the endpoint where zones with their requirements are fetched.
        const res = await fetch('/api/restaurant-zones');
        if (!res.ok) {
          throw new Error('Failed to fetch zone requirements');
        }
        const data = await res.json();
        // The returned data is expected to have a "zones" property.
        setZoneRequirements(data.zones);
      } catch (error) {
        console.error('Error fetching zone requirements:', error);
      }
    }
    fetchZoneRequirements();
  }, []);

  console.log('[ZoneFillingStatus] schedule:', schedule);
  console.log('[ZoneFillingStatus] zoneRequirements:', zoneRequirements);

  // Ensure we have an array.
  let zonesArray = [];
  if (Array.isArray(zoneRequirements)) {
    zonesArray = zoneRequirements;
  } else if (zoneRequirements && typeof zoneRequirements === 'object') {
    zonesArray = Object.values(zoneRequirements);
  }

  // Build the mapping of required staffing per zone and per day.
  const requiredMap = {};
  zonesArray.forEach((zone) => {
    const dailyRequired = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    // Check for either "requirements" or "roles_needed"
    const requirements = zone.requirements || zone.roles_needed || [];
    if (Array.isArray(requirements)) {
      requirements.forEach((req) => {
        const dayAbbrev = abbreviateDay(req.day_of_week);
        dailyRequired[dayAbbrev] += req.required_count || 0;
      });
    }
    // Use the zone name (or id if missing)
    requiredMap[zone.name || zone.id] = dailyRequired;
  });

  // Build a mapping of filled (scheduled) positions from the current schedule,
  // ignoring shifts marked as a no-show.
  const filledMap = {};
  Object.keys(schedule).forEach((zoneName) => {
    const dailyFilled = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    schedule[zoneName].forEach((employeeRow) => {
      Object.keys(employeeRow.days).forEach((day) => {
        // Filter out any shifts that are marked as a no-show.
        const validShifts = (employeeRow.days[day] || []).filter(shift => shift.status !== 'no_show');
        dailyFilled[day] += validShifts.length;
      });
    });
    filledMap[zoneName] = dailyFilled;
  });

  // Combine zone keys from both requiredMap and filledMap.
  const zoneNames = Array.from(new Set([...Object.keys(requiredMap), ...Object.keys(filledMap)]));

  // Fallback UI if no zones detected.
  if (zoneNames.length === 0) {
    return (
      <div className="mt-8 text-center">
        <h3 className="text-xl font-semibold mb-4">Zone Staffing Status</h3>
        <p>No staffing data available.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Zone Staffing Status</h3>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Zone</th>
            {days.map((day) => (
              <th key={day} className="px-4 py-2 border">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {zoneNames.map((zoneName) => {
            const requiredDays =
              requiredMap[zoneName] || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
            const filledDays =
              filledMap[zoneName] || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

            return (
              <tr key={zoneName}>
                <td className="px-4 py-2 border font-semibold">{zoneName}</td>
                {days.map((day) => {
                  const required = requiredDays[day] || 0;
                  const filled = filledDays[day] || 0;
                  const percent = required > 0 ? Math.round((filled / required) * 100) : 0;
                  return (
                    <td key={day} className="px-4 py-2 border text-center">
                      {required > 0 ? `${filled} / ${required} (${percent}%)` : '-'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ZoneFillingStatus; 