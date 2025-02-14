'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  DragDropContext,
  Droppable,
  Draggable
} from 'react-beautiful-dnd';
import NoShowModal from './NoShowModal';

// Helper: Convert full day names to abbreviations.
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
  const [schedule, setSchedule] = useState({}); // schedule grouped by zone → employee rows
  const [generatedWeeks, setGeneratedWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Employee data from API:
  const [employeeRestDaysMapping, setEmployeeRestDaysMapping] = useState({});
  const [employeeRolesMapping, setEmployeeRolesMapping] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);

  // Modal state for adding a shift.
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  // State for tracking the no-show modal.
  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
  const [noShowModalData, setNoShowModalData] = useState(null);

  // Days in order (Monday–Sunday)
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // -------------------------
  // Fetch employee data from your API.
  // -------------------------
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
          rolesMap[fullName] = (emp.roles && emp.roles.length > 0) ? emp.roles : ["Server", "Bartender", "Host"];
          console.log(`${fullName}: rest_days=`, restDaysMap[fullName], "; roles=", rolesMap[fullName]);
        });
        setEmployeeRestDaysMapping(restDaysMap);
        setEmployeeRolesMapping(rolesMap);
        setAllEmployees(data.employees);
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  // Debug helper: log when checking rest days.
  const isEmployeeRestDay = (employeeRow, day) => {
    const result = employeeRow.restDays && employeeRow.restDays.includes(day);
    console.log(`${employeeRow.employee_name}: restDays=${JSON.stringify(employeeRow.restDays)}; checking ${day} => ${result}`);
    return result;
  };

  // -------------------------
  // Fetch generated weeks.
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

  // -------------------------
  // Group generated shifts by employee and zone.
  // -------------------------
  function groupShiftsByEmployeeAndZone(shifts) {
    const grouped = {};
    for (const shift of shifts) {
      const key = `${shift.employee_id}_${shift.zone_id}`;
      if (!grouped[key]) {
        grouped[key] = {
          employee_id: shift.employee_id,
          zone_id: shift.zone_id,
          employeeName: shift.employee_name || String(shift.employee_id),
          zoneName: shift.zone_name || String(shift.zone_id),
          days: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] }
        };
      }
      const dayName = getDayName(shift.shift_date);
      if (grouped[key].days[dayName]) {
        grouped[key].days[dayName].push({
          ...shift,
          isCoverage: shift.is_coverage,
          coveredFor: shift.covered_for,
          coverageAssigned: shift.coverage_assigned,
          noShowReason: shift.no_show_reason
        });
      }
    }
    return grouped;
  }

  // Merge the schedule with employee rest days and available roles.
  const groupShiftsByArea = (shifts) => {
    const areaGrouped = {};
    const employeeZoneGrouped = groupShiftsByEmployeeAndZone(shifts);
    Object.values(employeeZoneGrouped).forEach(entry => {
      const area = entry.zoneName;
      if (!areaGrouped[area]) areaGrouped[area] = [];
      const fullName = entry.employeeName;
      areaGrouped[area].push({
        employee_id: entry.employee_id,
        zone_id: entry.zone_id,
        employee_name: fullName,
        zone_name: entry.zoneName,
        days: entry.days,
        restDays: employeeRestDaysMapping[fullName] || [],
        availableRoles: employeeRolesMapping[fullName] || []
      });
    });
    return areaGrouped;
  };

  // -------------------------
  // API Calls:
  // GET schedules, POST (generate) schedules, PUT (save) schedules.
  // -------------------------
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

  // Inline week selector and Generate Schedule button.
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Lookup employee id by full name.
  function getEmployeeIdByName(name, requiredRole) {
    // Find an employee that matches by name and whose roles include the required role.
    const candidate = allEmployees.find(emp => {
      // Assuming emp.name is a simple string and emp.roles is an array of role strings.
      return emp.name === name && emp.roles.some(role => role.toLowerCase() === requiredRole.toLowerCase());
    });
    return candidate ? candidate.id : null;
  }

  // -------------------------
  // Before saving, sanitize the schedule:
  // Remove the 'id' property from new shifts (with id starting with "new-" or "coverage-")
  // so that the DB can auto-generate a new id.
  const sanitizeScheduleForSaving = (sched) => {
    const newSched = {};
    for (const zone in sched) {
      newSched[zone] = sched[zone].map(employeeRow => {
        const newEmployeeRow = { ...employeeRow, days: {} };
        for (const day in employeeRow.days) {
          newEmployeeRow.days[day] = employeeRow.days[day].map(shift => {
            const newShift = { ...shift };
            if (
              typeof newShift.id === 'string' &&
              (newShift.id.startsWith('new-') || newShift.id.startsWith('coverage-'))
            ) {
              delete newShift.id;
              newShift.autoGen = true;
            }
            return newShift;
          });
        }
        return newEmployeeRow;
      });
    }
    return newSched;
  };

  // -------------------------
  // Handle Save Changes: Send schedule and coverage requests.
  // -------------------------
  const handleSaveChanges = async () => {
    // Build coverageRequests using tempId from each shift.
    const coverageRequests = [];
    for (const zone in schedule) {
      schedule[zone].forEach(employeeRow => {
        for (const day in employeeRow.days) {
          employeeRow.days[day].forEach(shift => {
            if (shift.status === 'no_show' && shift.coverageRequested) {
              coverageRequests.push({
                tempId: shift.tempId, // expect a non-empty value
                schedule_id: shift.originalShiftId || shift.id, // may be undefined for new shifts
                requested_by: shift.employee_id,
                reason: shift.noShowReason,
                status: 'pending',
                // Pass the required role (shift.role) in addition to the selected name.
                replacement_employee: shift.coverageAssigned
                  ? getEmployeeIdByName(shift.coverageAssigned, shift.role)
                  : null
              });
            }
          });
        }
      });
    }

    const sanitizedSchedule = sanitizeScheduleForSaving(schedule);

    try {
      const response = await fetch('/api/schedules/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: sanitizedSchedule,
          coverageRequests,
          startDate: selectedWeek.toISOString().split('T')[0],
          endDate: new Date(selectedWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save changes');
      }
      alert('Changes saved successfully');
      // Re-fetch the schedule to update the UI with new auto-generated IDs.
      handleWeekClick(selectedWeek);
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes: ' + error.message);
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

  // One employee can only have one shift per day.
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
  
    // droppableId format: "employeeName-day-zoneName" (sanitize spaces)
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

  // Open modal to add a shift.
  const openAddShiftModal = (zoneName, employeeRow, day) => {
    setModalData({ zoneName, employeeRow, day });
    setModalOpen(true);
  };

  const handleAddShiftModal = (selectedRole) => {
    const { zoneName, employeeRow, day } = modalData;
    const uniqueId = `new-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newShift = {
      id: uniqueId,
      employee_id: employeeRow.employee_id,
      employee_name: employeeRow.employee_name,
      zone_id: employeeRow.zone_id,
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

  // Open No-Show Modal when a shift is clicked.
  const openNoShowModal = (shift, zoneName, employeeName, day) => {
    // If the shift does not already have a tempId, assign one.
    const tempId = shift.tempId || `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    shift.tempId = tempId;
    setNoShowModalData({ shift, zoneName, employeeName, day });
    setNoShowModalOpen(true);
  };

  // Handle submission from the no-show modal.
  const handleNoShowSubmit = ({ reason, requestCoverage, selectedCoverage }) => {
    const { shift, zoneName, employeeName, day } = noShowModalData;
    const newSchedule = { ...schedule };

    if (newSchedule[zoneName]) {
      const employeeRowIndex = newSchedule[zoneName].findIndex(
        (row) => row.employee_name === employeeName
      );
      if (employeeRowIndex !== -1) {
        const employeeRow = newSchedule[zoneName][employeeRowIndex];
        const shiftIndex = (employeeRow.days[day] || []).findIndex(
          (s) => s.id === shift.id
        );
        if (shiftIndex !== -1) {
          // Ensure the shift gets a tempId.
          const tempId = shift.tempId || `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          const updatedShift = {
            ...employeeRow.days[day][shiftIndex],
            noShow: true,
            noShowReason: reason,
            coverageRequested: requestCoverage,
            tempId,
            status: 'no_show'
          };
          employeeRow.days[day][shiftIndex] = updatedShift;
        }
      }
    }

    if (requestCoverage && selectedCoverage) {
      const coverageRowIndex = newSchedule[zoneName].findIndex(
        (row) => row.employee_name === selectedCoverage
      );
      if (coverageRowIndex !== -1) {
        const coverageRow = newSchedule[zoneName][coverageRowIndex];
        // Use the same tempId as the no-show shift.
        const tempId = shift.tempId || `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const coverageShift = {
          ...shift,
          id: `coverage-${shift.id || tempId}-${Date.now()}`, // Temporary unique id.
          isCoverage: true,
          originalShiftId: shift.id,
          tempId,
          status: 'scheduled',
          coverageAssigned: selectedCoverage,
          coveredFor: employeeName
        };
        if (!coverageRow.days[day]) {
          coverageRow.days[day] = [];
        }
        coverageRow.days[day].push(coverageShift);
      }
    }

    setSchedule(newSchedule);
    setNoShowModalOpen(false);
    setNoShowModalData(null);
  };

  // -------------------------
  // Render "Staff Required" row.
  // -------------------------
  const computeStaffRequiredForZone = (employees) => {
    const totals = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    employees.forEach(emp => {
      DAYS.forEach(day => {
        const shifts = emp.days[day] || [];
        shifts.forEach(shift => {
          totals[day] += shift.required_count || 0;
        });
      });
    });
    return totals;
  };

  // -------------------------
  // Render Editable Schedule.
  // -------------------------
  const renderEditableSchedule = () => {
    const sortedZones = Object.keys(schedule).sort();
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        {sortedZones.map(zoneName => {
          const sortedEmployees = schedule[zoneName].sort((a, b) =>
            a.employee_name.localeCompare(b.employee_name)
          );
          const totals = computeStaffRequiredForZone(sortedEmployees);
          return (
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
                  {sortedEmployees.map(employeeRow => (
                    <tr key={employeeRow.employee_name} className="border-t">
                      <td className="p-3 font-medium text-gray-900">
                        {employeeRow.employee_name}
                        <span className="text-xs text-gray-500 ml-2">
                          (Rest: {employeeRow.restDays && employeeRow.restDays.length > 0 ? employeeRow.restDays.join(', ') : 'None'})
                        </span>
                      </td>
                      {DAYS.map(day => (
                        <td className="p-0 border-l" key={day}>
                          <Droppable droppableId={`${employeeRow.employee_name.replace(/\s+/g, '_')}-${day}-${zoneName.replace(/\s+/g, '_')}`}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{ minHeight: '50px', display: 'block' }}
                                className={`p-3 cursor-pointer ${isEmployeeRestDay(employeeRow, day) ? 'bg-gray-300' : ''}`}
                                onClick={() => {
                                  if (!(employeeRow.days[day] && employeeRow.days[day].length > 0)) {
                                    openAddShiftModal(zoneName, employeeRow, day);
                                  }
                                }}
                              >
                                {(employeeRow.days[day] || []).map((shift, index) => (
                                  <Draggable key={`shift-${shift.id}`} draggableId={`shift-${shift.id}`} index={index}>
                                    {(provided) => (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openNoShowModal(shift, zoneName, employeeRow.employee_name, day);
                                        }}
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{
                                          ...provided.draggableProps.style,
                                          minHeight: '30px',
                                          ...(shift.status === 'no_show'
                                            ? { backgroundColor: '#e3342f', color: 'white' }
                                            : shift.is_coverage
                                              ? { backgroundColor: '#ffed4a', color: 'black' }
                                              : { backgroundColor: '#bee3f8' }),
                                          fontWeight: 'bold'
                                        }}
                                        className={`p-2 m-1 rounded ${shift.conflict ? 'border border-red-500' : ''}`}
                                      >
                                        <div>{shift.role}</div>
                                        {shift.status === 'no_show' && !shift.is_coverage && (
                                          <>
                                            <div className="mt-1 text-sm">
                                              <span className="font-bold">No Show:</span> {shift.noShowReason || 'No reason provided'}
                                            </div>
                                            {shift.coverageAssigned && (
                                              <div className="mt-1 text-sm">
                                                <span className="font-bold">Covered by:</span> {shift.coverageAssigned}
                                              </div>
                                            )}
                                          </>
                                        )}
                                        {shift.is_coverage && (
                                          <div className="mt-1 p-1 bg-yellow-300 text-black rounded">
                                            <span className="font-bold">Covering for:</span> {shift.coveredFor}
                                          </div>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteShift(zoneName, employeeRow.employee_name, day, index);
                                          }}
                                          className="ml-1 text-sm text-red-500"
                                        >
                                          X
                                        </button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-gray-50 border-t">
                    <td className="p-3 text-right font-medium text-gray-700">Staff Required</td>
                    {DAYS.map(day => (
                      <td key={day} className="p-3 text-center font-medium text-gray-900 border-l">
                        {computeStaffRequiredForZone(schedule[Object.keys(schedule)[0]] || [])[day] || '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </DragDropContext>
    );
  };

  // -------------------------
  // Render Modal for Adding a Shift.
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

  // -------------------------
  // Render Modal for Generating a Schedule.
  // (Not used in this version since the week selector is inline.)
  // -------------------------
  const renderGenerateModal = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
          <h3 className="text-lg font-bold mb-4">Generate Schedule</h3>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Week:</label>
            <select
              value={selectedWeek.toISOString()}
              onChange={(e) => setSelectedWeek(new Date(e.target.value))}
              className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {generateWeekOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleGenerateSchedule}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Generate'}
            </button>
            <button
              onClick={() => setShowDatePicker(false)}
              className="ml-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
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
  
      {/* Inline Week Selector and Generate Schedule button */}
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
        <div>
          <button
            onClick={handleGenerateSchedule}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Generate Schedule'}
          </button>
        </div>
      </div>
  
      {Object.keys(schedule).length > 0 ? (
        renderEditableSchedule()
      ) : (
        <p>No schedule data available.</p>
      )}
  
      <div className="mt-4">
        <button
          onClick={handleSaveChanges}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Save Changes
        </button>
      </div>
  
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
      {noShowModalOpen && noShowModalData && (
        <NoShowModal
          shift={noShowModalData.shift}
          employeeName={noShowModalData.employeeName}
          day={noShowModalData.day}
          availableCoverageEmployees={allEmployees.filter(emp => {
            const fullName = `${emp.first_name} ${emp.last_name}`;
            const coverDays = (emp.rest_day_coverage || []).map(day => abbreviateDay(day));
            return coverDays.includes(noShowModalData.day) && fullName !== noShowModalData.employeeName;
          })}
          onSubmit={handleNoShowSubmit}
          onClose={() => {
            setNoShowModalOpen(false);
            setNoShowModalData(null);
          }}
        />
      )}
    </div>
  );

}
