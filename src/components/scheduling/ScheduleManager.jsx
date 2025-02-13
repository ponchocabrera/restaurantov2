'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ScheduleManager() {
  const { data: session } = useSession();
  const [schedule, setSchedule] = useState([]);
  const [generatedWeeks, setGeneratedWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      const grouped = groupShiftsByArea(data.schedules || []);
setSchedule(grouped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold">Schedule Management</h2>

      <div className="mb-4">
        <h3 className="text-lg font-bold">Dates with Schedules</h3>
        <table className="min-w-full bg-white border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border">Week Start</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 border text-center text-gray-500">Loading...</td>
              </tr>
            ) : generatedWeeks.length > 0 ? (
              generatedWeeks.map((weekStart, index) => (
                <tr key={index} onClick={() => handleWeekClick(new Date(weekStart))} className="cursor-pointer hover:bg-gray-200">
                  <td className="p-3 border">{weekStart}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-3 border text-center text-gray-500">No schedules available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {Object.keys(schedule).length > 0 && (
        <div className="overflow-x-auto">
          {Object.entries(schedule).map(([area, shifts]) => (
            <div key={area} className="mb-6">
              <h3 className="text-lg font-bold">{area}</h3>
              <table className="min-w-full bg-white border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 border">Employee</th>
                    <th className="p-3 border">Zone</th>
                    {DAYS.map(day => (
                      <th key={day} className="p-3 border">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                {(Array.isArray(shifts) ? shifts : []).map((row, index) => (
                    <tr key={index}>
                      <td className="p-3 border">{row.employee_name}</td>
                      <td className="p-3 border">{row.zone_name}</td>
                      {DAYS.map(day => {
                        const shiftsForDay = row.days?.[day] || [];
                        return (
                          <td key={day} className="p-3 border align-top">
                            {shiftsForDay.length === 0 ? '-' : shiftsForDay.map((shift, i) => (
                              <div key={i} className="mb-1 p-1 bg-blue-50 rounded text-sm">
                                <div className="font-medium">
                                  {shift.start_time} - {shift.end_time}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {shift.role}
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
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
