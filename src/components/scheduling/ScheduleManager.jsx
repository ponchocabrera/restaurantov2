'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ScheduleManager() {
  const { data: session } = useSession();
  const [schedule, setSchedule] = useState({});
  const [generatedWeeks, setGeneratedWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState([]);

  // Days of the week in display order
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    const fetchGeneratedWeeks = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/schedules/weeks');
        if (!response.ok) {
          throw new Error('Failed to fetch generated weeks');
        }
        const data = await response.json();
        setGeneratedWeeks(data.weeks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGeneratedWeeks();
  }, []);

  // Helper: Start of this week (Monday)
  function getStartOfWeek() {
    const now = new Date();
    // day = 0 (Sun) to 6 (Sat)
    const day = now.getDay();
    // Force Monday as start
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }

  // Convert a date string (YYYY-MM-DD) into a day of week (e.g., 'Mon')
  function getDayName(dateStr) {
    const date = new Date(dateStr); // e.g. new Date('2025-02-11')
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    const mapping = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return mapping[dayIndex];
  }

  /**
   * Build a data structure grouping shifts by (employee_id, zone_id).
   * Example shape:
   * {
   *   "18_3": {
   *     employeeId: 18,
   *     zoneId: 3,
   *     employeeName: "John Doe",
   *     zoneName: "Front of House",
   *     days: {
   *       Mon: [ shift1, shift2, ... ],
   *       Tue: [],
   *       ...
   *       Sun: []
   *     }
   *   },
   *   "16_6": {
   *     ...
   *   }
   * }
   */
  function groupShiftsByEmployeeAndZone(shifts) {
    const grouped = {};
    for (const shift of shifts) {
      const key = `${shift.employee_id}_${shift.zone_id}`;
      if (!grouped[key]) {
        grouped[key] = {
          employeeId: shift.employee_id,
          zoneId: shift.zone_id,
          employeeName: shift.employee_name || String(shift.employee_id),
          zoneName: shift.zone_name || String(shift.zone_id),
          days: {
            Mon: [],
            Tue: [],
            Wed: [],
            Thu: [],
            Fri: [],
            Sat: [],
            Sun: []
          }
        };
      }
      const dayName = getDayName(shift.shift_date);
      if (grouped[key].days[dayName]) {
        grouped[key].days[dayName].push(shift);
      }
    }
    return grouped;
  }

  /**
   * Group shifts by area (i.e., by zoneName) to prepare for table rendering.
   * The returned shape is:
   * {
   *   "Front of House": [
   *      { employee_name, zone_name, days },
   *      ...
   *   ],
   *   "Kitchen": [ ... ]
   * }
   */
  const groupShiftsByArea = (shifts) => {
    const areaGrouped = {};
    const employeeZoneGrouped = groupShiftsByEmployeeAndZone(shifts);
    
    // Convert to array of entries before regrouping
    const entries = Object.values(employeeZoneGrouped);
    
    entries.forEach(entry => {
      const area = entry.zoneName;
      if (!areaGrouped[area]) {
        areaGrouped[area] = []; // Ensure this is always an array
      }
      // Add proper array structure for the table
      areaGrouped[area].push({
        employee_name: entry.employeeName,
        zone_name: entry.zoneName,
        days: entry.days
      });
    });
    
    return areaGrouped;
  };

  // Updated: Use groupShiftsByArea here for consistency.
  const handleWeekClick = async (weekStart) => {
    setLoading(true);
    setError('');
    try {
      const endDate = new Date(weekStart);
      endDate.setDate(endDate.getDate() + 6);

      const response = await fetch(`/api/schedules?startDate=${weekStart.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`);
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      const data = await response.json();
      // <--- Change: Use groupShiftsByArea instead of groupShiftsByEmployeeAndZone
      const grouped = groupShiftsByArea(data.schedules || []);
      setSchedule(grouped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const groupShiftsByAreaForRender = (shifts) => {
    // This helper is redundant if you always store the schedule in the grouped-by-area format,
    // but it's here in case you need to regroup.
    const areaGrouped = {};
    const employeeZoneGrouped = groupShiftsByEmployeeAndZone(shifts);
    
    Object.values(employeeZoneGrouped).forEach(entry => {
      const area = entry.zoneName;
      if (!areaGrouped[area]) {
        areaGrouped[area] = [];
      }
      areaGrouped[area].push({
        employee_name: entry.employeeName,
        zone_name: entry.zoneName,
        days: entry.days
      });
    });
    return areaGrouped;
  };

  const handleGenerateSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const endDate = new Date(selectedWeek);
      endDate.setDate(endDate.getDate() + 6);

      const response = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: selectedWeek.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate schedule');
      }

      const data = await response.json();
      
      // Ensure we're working with array data
      const scheduleData = Array.isArray(data.schedule) ? data.schedule : [];
      const grouped = groupShiftsByArea(scheduleData);
      
      setSchedule(grouped);

      // Update generated weeks
      setGeneratedWeeks(prev => [...new Set([...prev, selectedWeek.toISOString().split('T')[0]])]);
      setShowDatePicker(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function generateWeekOptions() {
    const options = [];
    // Only show weeks that exist in generatedWeeks
    generatedWeeks.forEach(weekStr => {
      const weekStart = new Date(weekStr);
      options.push({
        value: weekStart.toISOString(),
        label: `Week of ${weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })}`
      });
    });
    return options;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold">Schedule Management</h2>
      
      <div className="my-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Scheduling Priorities</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span><strong>Role Matching:</strong> Employees only scheduled for roles they're trained in</span>
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span><strong>Availability First:</strong> Only considers employees marked available for shift times</span>
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span><strong>Fair Distribution:</strong> Prioritizes employees with fewer recent shifts first</span>
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span><strong>Requirements First:</strong> Always meets minimum staffing needs before adding extras</span>
          </li>
        </ul>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Select Week:</label>
          <select 
            value={selectedWeek.toISOString()}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              setSelectedWeek(newDate);
              handleWeekClick(newDate);
            }}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {generateWeekOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {Object.keys(schedule).length > 0 && (
        <div className="space-y-8">
          {Object.entries(schedule).map(([area, shifts]) => {
            const timeGroups = shifts.reduce((groups, shift) => {
              const dayShifts = Object.entries(shift.days).flatMap(([day, shifts]) => 
                shifts.map(s => ({ ...s, day }))
              );
              
              dayShifts.forEach(({ start_time, end_time, ...rest }) => {
                const timeKey = `${start_time}-${end_time}`;
                groups[timeKey] = groups[timeKey] || [];
                groups[timeKey].push({ ...rest, start_time, end_time, day: rest.day });
              });
              return groups;
            }, {});

            return Object.entries(timeGroups).map(([timeSlot, timeShifts]) => (
              <div key={`${area}-${timeSlot}`} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm4 0h2v2h-2V5zM5 10h2v2H5v-2zm4 0h2v2H9v-2zm4 0h2v2h-2v-2z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{area}</h3>
                      <p className="text-sm text-gray-500">
                        {timeSlot} Shift • {new Set(timeShifts.map(s => s.employee_name)).size} employees scheduled
                      </p>
                    </div>
                  </div>
                </div>

                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-700">Employee</th>
                      {DAYS.map(day => (
                        <th 
                          key={day} 
                          className="p-3 text-center text-sm font-medium text-gray-700 border-l"
                        >
                          {day.slice(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody>
                    {Array.from(new Set(timeShifts.map(s => s.employee_name))).map(employee => (
                      <tr key={employee} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{employee}</td>
                        {DAYS.map(day => {
                          const employeeShifts = timeShifts.filter(
                            s => s.day === day && s.employee_name === employee
                          );
                          return (
                            <td key={day} className="p-3 text-center border-l">
                              {employeeShifts.length > 0 ? (
                                <span className="inline-block px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                                  {employeeShifts[0].role}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    
                    <tr className="bg-gray-50 border-t">
                      <td className="p-3 text-right font-medium text-gray-700">Staff Required</td>
                      {DAYS.map(day => {
                        const total = timeShifts
                          .filter(s => s.day === day)
                          .reduce((sum, shift) => sum + (shift.required_count || 0), 0);
                        return (
                          <td key={day} className="p-3 text-center font-medium text-gray-900 border-l">
                            {total > 0 ? total : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            ));
          })}
        </div>
      )}

      {showDatePicker && (
        <div className="mt-4">
          <input
            type="date"
            value={selectedWeek.toISOString().split('T')[0]}
            onChange={(e) => setSelectedWeek(new Date(e.target.value))}
            className="border rounded p-2"
          />
          <button
            onClick={handleGenerateSchedule}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Generate Schedule'}
          </button>
        </div>
      )}

      <button
        onClick={() => setShowDatePicker(!showDatePicker)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
      >
        {showDatePicker ? 'Cancel' : 'Select Week to Generate Schedule'}
      </button>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
