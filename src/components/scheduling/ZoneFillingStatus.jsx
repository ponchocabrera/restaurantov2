import React, { useState, useEffect } from 'react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
        const res = await fetch('/api/restaurant-zones');
        if (!res.ok) {
          throw new Error('Failed to fetch zone requirements');
        }
        const data = await res.json();
        setZoneRequirements(data.zones);
      } catch (error) {
        console.error('Error fetching zone requirements:', error);
      }
    }
    fetchZoneRequirements();
  }, []);

  let zonesArray = [];
  if (Array.isArray(zoneRequirements)) {
    zonesArray = zoneRequirements;
  } else if (zoneRequirements && typeof zoneRequirements === 'object') {
    zonesArray = Object.values(zoneRequirements);
  }

  // Build a map of required staffing per zone & day
  const requiredMap = {};
  zonesArray.forEach((zone) => {
    const dailyRequired = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const requirements = zone.requirements || zone.roles_needed || [];
    if (Array.isArray(requirements)) {
      requirements.forEach((req) => {
        const dayAbbrev = abbreviateDay(req.day_of_week);
        dailyRequired[dayAbbrev] += req.required_count || 0;
      });
    }
    requiredMap[zone.name || zone.id] = dailyRequired;
  });

  // Build a map of filled (scheduled) positions ignoring no-show shifts
  const filledMap = {};
  Object.keys(schedule).forEach((zoneName) => {
    const dailyFilled = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    schedule[zoneName].forEach((employeeRow) => {
      Object.keys(employeeRow.days).forEach((day) => {
        const validShifts = (employeeRow.days[day] || []).filter(
          (shift) => shift.status !== 'no_show'
        );
        dailyFilled[day] += validShifts.length;
      });
    });
    filledMap[zoneName] = dailyFilled;
  });

  const zoneNames = Array.from(
    new Set([...Object.keys(requiredMap), ...Object.keys(filledMap)])
  );

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
      {/* Responsive container for horizontal scroll */}
      <div className="overflow-x-auto w-full">
        <table className="table-fixed w-full min-w-[600px] border text-sm sm:text-base bg-white">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-2 border-r">Zone</th>
              {days.map((day) => (
                <th key={day} className="px-4 py-2 border-r text-center">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zoneNames.map((zoneName) => {
              const requiredDays =
                requiredMap[zoneName] || {
                  Mon: 0,
                  Tue: 0,
                  Wed: 0,
                  Thu: 0,
                  Fri: 0,
                  Sat: 0,
                  Sun: 0
                };
              const filledDays =
                filledMap[zoneName] || {
                  Mon: 0,
                  Tue: 0,
                  Wed: 0,
                  Thu: 0,
                  Fri: 0,
                  Sat: 0,
                  Sun: 0
                };

              return (
                <tr key={zoneName} className="border-b last:border-b-0">
                  <td className="px-4 py-2 border-r font-semibold">
                    {zoneName}
                  </td>
                  {days.map((day) => {
                    const required = requiredDays[day] || 0;
                    const filled = filledDays[day] || 0;
                    const percent = required > 0 ? Math.round((filled / required) * 100) : 0;

                    return (
                      <td key={day} className="px-4 py-2 border-r text-center">
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
    </div>
  );
};

export default ZoneFillingStatus;
