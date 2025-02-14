'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  DragDropContext,
  Droppable,
  Draggable
} from 'react-beautiful-dnd';

// Helper to convert full day names to abbreviations.
const abbreviateDay = (day) => {
  const map = {
    "Monday": "Mon",
    "Tuesday": "Tue",
    "Wednesday": "Wed",
    "Thursday": "Thu",
    "Friday": "Fri",
    "Saturday": "Sat",
    "Sunday": "Sun"
  };
  return map[day] || day;
};

export default function ScheduleManager() {
  const { data: session } = useSession();
  const [schedule, setSchedule] = useState({}); // grouped by zone → employee rows
  const [generatedWeeks, setGeneratedWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // New states for employee data:
  const [employeeRestDaysMapping, setEmployeeRestDaysMapping] = useState({});
  const [employeeRolesMapping, setEmployeeRolesMapping] = useState({});

  // Days in order (Monday–Sunday)
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Fetch employee data (including rest_days and roles) from your API.
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error('Failed to fetch employees');
        const data = await res.json();
        const rolesMap = {};
        const restDaysMap = {};
        data.employees.forEach(emp => {
          const fullName = `${emp.first_name} ${emp.last_name}`;
          restDaysMap[fullName] = (emp.rest_days || []).map(day => abbreviateDay(day));
          rolesMap[fullName] = (emp.roles && emp.roles.length > 0)
            ? emp.roles
            : ["Server", "Bartender", "Host"];
          console.log(`${fullName}: rest_days=`, restDaysMap[fullName], "; roles=", rolesMap[fullName]);
        });
        setEmployeeRestDaysMapping(restDaysMap);
        setEmployeeRolesMapping(rolesMap);
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  // Debugging: log when checking rest days.
  const isEmployeeRestDay = (employeeRow, day) => {
    const result = employeeRow.restDays && employeeRow.restDays.includes(day);
    console.log(`${employeeRow.employee_name}: restDays=${JSON.stringify(employeeRow.restDays)}; checking ${day} => ${result}`);
    return result;
  };

  // -------------------------
  // Existing functions for generated weeks
  // -------------------------
  useEffect(() => {
    const fetchGeneratedWeeks = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/schedules/weeks');
        if (!response.ok) throw new Error('Failed to fetch generated weeks');
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

  function getStartOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }

  function getDayName(dateStr) {
    const date = new Date(dateStr);
    const mapping = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return mapping[date.getDay()];
  }

  // Group shifts by employee and zone.
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
          days: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] }
        };
      }
      const dayName = getDayName(shift.shift_date);
      if (grouped[key].days[dayName]) {
        grouped[key].days[dayName].push(shift);
      }
    }
    return grouped;
  }

  // Group by zone and merge in employee rest days and available roles.
  const groupShiftsByArea = (shifts) => {
    const areaGrouped = {};
    const employeeZoneGrouped = groupShiftsByEmployeeAndZone(shifts);
    Object.values(employeeZoneGrouped).forEach(entry => {
      const area = entry.zoneName;
      if (!areaGrouped[area]) areaGrouped[area] = [];
      const fullName = entry.employeeName;
      areaGrouped[area].push({
        employee_name: fullName,
        zone_name: entry.zoneName,
        days: entry.days,
        restDays: employeeRestDaysMapping[fullName] || [],
        availableRoles: employeeRolesMapping[fullName] || []
      });
    });
    return areaGrouped;
  };

  const handleWeekClick = async (weekStart) => {
    setLoading(true);
    setError('');
    try {
      const endDate = new Date(weekStart);
      endDate.setDate(endDate.getDate() + 6);
      const response = await fetch(
        `/api/schedules?startDate=${weekStart.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      const grouped = groupShiftsByArea(data.schedules || []);
      setSchedule(grouped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      if (!response.ok) throw new Error('Failed to generate schedule');
      const data = await response.json();
      const scheduleData = Array.isArray(data.schedule) ? data.schedule : [];
      const grouped = groupShiftsByArea(scheduleData);
      setSchedule(grouped);
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
    generatedWeeks.forEach(weekStr => {
      const weekStart = new Date(weekStr);
      options.push({
        value: weekStart.toISOString(),
        label: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      });
    });
    return options;
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedWeek);
    d.setDate(selectedWeek.getDate() + i);
    return d;
  });

  // -------------------------
  // Drag & Drop, Add, Delete, Conflict detection
  // -------------------------
  const getDateForDay = (dayAbbrev) => {
    const index = DAYS.indexOf(dayAbbrev);
    return weekDates[index] ? weekDates[index].toISOString().split('T')[0] : '';
  };

  // New conflict function: one employee can only have one shift per day.
  const hasConflictForEmployeeOnDay = (employeeName, day) => {
    for (const zone in schedule) {
      const employees = schedule[zone];
      const row = employees.find(r => r.employee_name === employeeName);
      if (row && row.days[day] && row.days[day].length > 0) {
        return true;
      }
    }
    return false;
  };

  const handleDeleteShift = (zoneName, employeeName, day, shiftIndex) => {
    const newSchedule = { ...schedule };
    const zoneEmployees = newSchedule[zoneName];
    const rowIndex = zoneEmployees.findIndex(row => row.employee_name === employeeName);
    if (rowIndex !== -1) {
      const cellShifts = [...(zoneEmployees[rowIndex].days[day] || [])];
      cellShifts.splice(shiftIndex, 1);
      zoneEmployees[rowIndex].days[day] = cellShifts;
    }
    setSchedule(newSchedule);
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
  
    // droppableId format: "employeeName-day-zoneName"
    const sanitize = (str) => str.replace(/\s+/g, '_');
    const [employee, sourceDay, zoneName] = source.droppableId.split('-').map(sanitize);
    const [destEmployee, destDay, destZone] = destination.droppableId.split('-').map(sanitize);
    if (employee !== destEmployee || zoneName !== destZone) return;
  
    const newSchedule = { ...schedule };
    const zoneEmployees = newSchedule[zoneName];
    const empIndex = zoneEmployees.findIndex(row => sanitize(row.employee_name) === employee);
    if (empIndex !== -1) {
      const sourceShifts = [...(zoneEmployees[empIndex].days[sourceDay] || [])];
      const [movedShift] = sourceShifts.splice(source.index, 1);
      zoneEmployees[empIndex].days[sourceDay] = sourceShifts;
      movedShift.shift_date = getDateForDay(destDay);
      // When moving, if destination cell already has a shift, flag conflict.
      if (hasConflictForEmployeeOnDay(employee, destDay)) {
        movedShift.conflict = true;
      } else {
        movedShift.conflict = false;
      }
      const destShifts = zoneEmployees[empIndex].days[destDay] || [];
      zoneEmployees[empIndex].days[destDay] = [...destShifts, movedShift];
    }
    setSchedule(newSchedule);
  };
  
  // Instead of prompt, open the modal to add a shift.
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  
  const openAddShiftModal = (zoneName, employeeRow, day) => {
    setModalData({ zoneName, employeeRow, day });
    setModalOpen(true);
  };
  
  const handleAddShiftModal = (selectedRole) => {
    const { zoneName, employeeRow, day } = modalData;
    const newShift = {
      employee_id: employeeRow.employee_name, // demo purposes
      employee_name: employeeRow.employee_name,
      zone_name: employeeRow.zone_name,
      shift_date: getDateForDay(day),
      start_time: "09:00",
      end_time: "17:00",
      role: selectedRole,
      ownerModified: true,
      conflict: hasConflictForEmployeeOnDay(employeeRow.employee_name, day),
      required_count: 1
    };
    const newSchedule = { ...schedule };
    const zoneEmployees = newSchedule[zoneName];
    const index = zoneEmployees.findIndex(row => row.employee_name === employeeRow.employee_name);
    if (index !== -1) {
      if (!zoneEmployees[index].days[day]) zoneEmployees[index].days[day] = [];
      zoneEmployees[index].days[day].push(newShift);
    }
    setSchedule(newSchedule);
    setModalOpen(false);
    setModalData(null);
  };
  
  // -------------------------
  // Render Editable Schedule
  // -------------------------
  // Wrap droppable content in a <div> inside the <td> to avoid table element issues.
  const renderEditableSchedule = () => {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        {Object.entries(schedule).map(([zoneName, employees]) => (
          <div key={zoneName} className="mb-4">
            <h3 className="text-lg font-semibold">{zoneName}</h3>
            <table className="w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-700">Employee</th>
                  {weekDates.map((date, idx) => (
                    <th key={idx} className="p-3 text-center text-sm font-medium text-gray-700 border-l">
                      <div>{DAYS[idx]}</div>
                      <div className="text-xs text-gray-500">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employeeRow) => (
                  <tr key={employeeRow.employee_name} className="border-t">
                    <td className="p-3 font-medium text-gray-900">
                      {employeeRow.employee_name}
                      <span className="text-xs text-gray-500 ml-2">
                        (Rest: {employeeRow.restDays && employeeRow.restDays.length > 0 ? employeeRow.restDays.join(', ') : 'None'})
                      </span>
                    </td>
                    {DAYS.map(day => (
                      <Droppable droppableId={`${employeeRow.employee_name.replace(/\s+/g, '_')}-${day}-${zoneName.replace(/\s+/g, '_')}`} key={day}>
                        {(provided) => (
                          <td className="p-0 border-l">
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              style={{ display: "block" }}
                              className={`p-3 cursor-pointer ${isEmployeeRestDay(employeeRow, day) ? 'bg-gray-300' : ''}`}
                              onClick={() => {
                                if (!(employeeRow.days[day] && employeeRow.days[day].length > 0)) {
                                  openAddShiftModal(zoneName, employeeRow, day);
                                }
                              }}
                            >
                              {(employeeRow.days[day] || []).map((shift, index) => (
                                <Draggable
                                  draggableId={`shift-${employeeRow.employee_name.replace(/\s+/g, '_')}-${day}-${zoneName.replace(/\s+/g, '_')}-${index}`}
                                  index={index}
                                  key={`shift-${employeeRow.employee_name}-${day}-${zoneName}-${index}`}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{ ...provided.draggableProps.style, minHeight: '30px' }}
                                      className={`p-2 m-1 rounded ${shift.ownerModified ? 'bg-green-200' : 'bg-blue-100'} ${shift.conflict ? 'border border-red-500' : ''}`}
                                    >
                                      {shift.role}
                                      {shift.conflict && (
                                        <span
                                          title="This shift causes a conflict: the employee is already scheduled for another shift on this day."
                                          className="text-red-500 ml-1"
                                        >
                                          ⚠️
                                        </span>
                                      )}
                                      {shift.ownerModified && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteShift(zoneName, employeeRow.employee_name, day, index);
                                          }}
                                          className="ml-1 text-sm text-red-500"
                                        >
                                          X
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          </td>
                        )}
                      </Droppable>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </DragDropContext>
    );
  };
  
  // -------------------------
  // Render Modal for adding a shift
  // -------------------------
  const renderModal = () => {
    if (!modalOpen || !modalData) return null;
    const { employeeRow, day } = modalData;
    const availableRoles = employeeRow.availableRoles && employeeRow.availableRoles.length > 0
      ? employeeRow.availableRoles
      : ["Server", "Bartender", "Host"];
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
          <h3 className="text-lg font-bold mb-4">Select a Role</h3>
          <p className="mb-4">
            Choose a role for <strong>{employeeRow.employee_name}</strong> on <strong>{day}</strong>.
          </p>
          <div className="space-y-2">
            {availableRoles.map((role) => (
              <button
                key={role}
                onClick={() => handleAddShiftModal(role)}
                className="w-full text-left p-2 bg-blue-100 rounded hover:bg-blue-200"
              >
                {role}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => { setModalOpen(false); setModalData(null); }}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };
  
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
  
      {Object.keys(schedule).length > 0 ? (
        renderEditableSchedule()
      ) : (
        <p>No schedule data available.</p>
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
  
      {modalOpen && renderModal()}
    </div>
  );
}
