'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  DragDropContext,
  Droppable,
  Draggable
} from 'react-beautiful-dnd';
import NoShowModal from './NoShowModal';
import { startOfWeek, format } from 'date-fns';

//
// Utility to abbreviate day names
//
const abbreviateDay = (day) => {
  const map = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun'
  };
  return map[day] || day;
};

//
// Use date-fns to get Monday (startOfWeek with { weekStartsOn: 1 })
//
const getCurrentWeekStart = (date) => startOfWeek(date, { weekStartsOn: 1 });

//
// Check if employee is busy for a given day
//
function isEmployeeBusy(schedule, employeeName, dayAbbrev) {
  for (const zoneName in schedule) {
    const employees = schedule[zoneName];
    for (const row of employees) {
      if (row.employee_name === employeeName) {
        if (row.days[dayAbbrev] && row.days[dayAbbrev].length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

export default function ScheduleManager({ compact }) {
  const { data: session } = useSession();

  const [schedule, setSchedule] = useState({});
  const [generatedWeeks, setGeneratedWeeks] = useState([]);

  // Default to this week's Monday
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekStart(new Date()));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Employee data
  const [employeeRestDaysMapping, setEmployeeRestDaysMapping] = useState({});
  const [employeeRolesMapping, setEmployeeRolesMapping] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
  const [noShowModalData, setNoShowModalData] = useState(null);

  // Save confirmation
  const [saveSummary, setSaveSummary] = useState(null);

  // Toggle for "How do we schedule" dropdown
  const [showHowWeSchedule, setShowHowWeSchedule] = useState(false);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  //
  // Fetch employees
  //
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error('Failed to fetch employees');
        const data = await res.json();

        const rolesMap = {};
        const restDaysMap = {};
        data.employees.forEach((emp) => {
          const fullName = `${emp.first_name} ${emp.last_name}`;
          restDaysMap[fullName] = (emp.rest_days || []).map((d) => abbreviateDay(d));
          rolesMap[fullName] = emp.roles && emp.roles.length > 0
            ? emp.roles
            : ['Server', 'Bartender', 'Host'];
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

  function isEmployeeRestDay(employeeRow, day) {
    return employeeRow.restDays && employeeRow.restDays.includes(day);
  }

  //
  // Fetch the list of generated week starts
  //
  useEffect(() => {
    const fetchGeneratedWeeks = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/schedules/weeks');
        if (!response.ok) throw new Error('Failed to fetch generated weeks');
        const data = await response.json();
        setGeneratedWeeks(data.weeks || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGeneratedWeeks();
  }, []);

  //
  // Convert a shift's date string to day abbreviation
  //
  function getDayName(dateStr) {
    const date = new Date(dateStr);
    const mapping = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return mapping[date.getDay()];
  }

  //
  // Group shifts by employee & zone
  //
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
          noShowReason: shift.no_show_reason,
          coverage_status: shift.coverage_status
        });
      }
    }
    return grouped;
  }

  //
  // Then group everything by zone
  //
  function groupShiftsByArea(shifts) {
    const areaGrouped = {};
    const employeeZoneGrouped = groupShiftsByEmployeeAndZone(shifts);
    Object.values(employeeZoneGrouped).forEach((entry) => {
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
  }

  //
  // Handle "Week Click" / fetch schedule for a given start date
  //
  async function handleWeekClick(weekStart) {
    setLoading(true);
    setError('');
    try {
      // Format start & end dates
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endWeek = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const endDate = format(endWeek, 'yyyy-MM-dd');

      const response = await fetch(`/api/schedules?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      const grouped = groupShiftsByArea(data.schedules || []);
      setSchedule(grouped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  //
  // On first mount, fetch the default week's schedule
  //
  useEffect(() => {
    handleWeekClick(selectedWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //
  // Generate new schedule for the selected week
  // (then re‐fetch from the GET endpoint to get the fresh data)
  //
  async function handleGenerateSchedule() {
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

      // Once generation is done, fetch the new schedule
      await handleWeekClick(selectedWeek);

      // Optionally add this newly generated week to our local list
      setGeneratedWeeks((prev) => [
        ...new Set([...prev, selectedWeek.toISOString().split('T')[0]])
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getEmployeeIdByName(name, requiredRole) {
    const candidate = allEmployees.find((emp) => {
      const fullName = `${emp.first_name} ${emp.last_name}`;
      return (
        fullName === name &&
        emp.roles.some((role) => role.toLowerCase() === requiredRole.toLowerCase())
      );
    });
    return candidate ? candidate.id : null;
  }

  //
  // For new coverage shifts, remove the "temp" ID on save
  //
  function sanitizeScheduleForSaving(sched) {
    const newSched = {};
    for (const zone in sched) {
      newSched[zone] = sched[zone].map((employeeRow) => {
        const newEmployeeRow = { ...employeeRow, days: {} };
        for (const day in employeeRow.days) {
          newEmployeeRow.days[day] = employeeRow.days[day].map((shift) => {
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
  }

  //
  // Handle Save Changes
  //
  async function handleSaveChanges() {
    setError('');
    const coverageRequests = [];
    const noShowEvents = [];

    for (const zone in schedule) {
      schedule[zone].forEach((employeeRow) => {
        for (const day in employeeRow.days) {
          employeeRow.days[day].forEach((shift) => {
            if (!shift.userChanged) return;

            // If no-show, gather info
            if (shift.status === 'no_show') {
              noShowEvents.push({
                day: shift.shift_date,
                noShowEmployee: employeeRow.employee_name,
                coverageEmployee: shift.coverageAssigned || null
              });
              if (shift.coverageRequested) {
                coverageRequests.push({
                  tempId: shift.tempId,
                  schedule_id: shift.originalShiftId || shift.id,
                  requested_by: shift.employee_id,
                  reason: shift.noShowReason,
                  status: 'pending',
                  replacement_employee: shift.coverageAssigned
                    ? getEmployeeIdByName(shift.coverageAssigned, shift.role)
                    : null
                });
              }
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

      const data = await response.json();
      const summary = {
        message: data.message || 'Changes saved successfully',
        noShowEvents
      };
      setSaveSummary(summary);

      // Refresh the schedule
      handleWeekClick(selectedWeek);
    } catch (error) {
      console.error('Error saving changes:', error);
      setError(error.message || 'Error saving changes');
    }
  }

  //
  // Generate the <option> list from generatedWeeks + the current selected week
  // 
  function generateWeekOptions() {
    // Combine weeks from state with the current selected week
    const currentWeekStr = selectedWeek.toISOString().split('T')[0];
    const allWeeks = new Set([...generatedWeeks, currentWeekStr]);

    // Sort them in ascending date order
    const sortedWeeks = Array.from(allWeeks).sort((a, b) => new Date(a) - new Date(b));

    // Build an array of { value, label }
    return sortedWeeks.map((weekStr) => {
      const weekDate = new Date(weekStr);
      return {
        value: weekStr,
        label: `Week of ${weekDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })}`
      };
    });
  }

  // Build an array of 7 consecutive days from the selectedWeek
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedWeek);
    d.setDate(selectedWeek.getDate() + i);
    return d;
  });

  //
  // handleDragEnd from react-beautiful-dnd
  //
  function handleDragEnd(result) {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sanitize = (str) => str.replace(/\s+/g, '_');
    const [employee, sourceDay, zoneName] = source.droppableId
      .split('-')
      .map(sanitize);
    const [destEmployee, destDay, destZone] = destination.droppableId
      .split('-')
      .map(sanitize);

    if (employee !== destEmployee || zoneName !== destZone) return;

    const newSchedule = { ...schedule };
    const zoneEmployees = newSchedule[zoneName];
    const empIndex = zoneEmployees.findIndex(
      (row) => row.employee_name.replace(/\s+/g, '_') === employee
    );

    if (empIndex !== -1) {
      const sourceShifts = [...(zoneEmployees[empIndex].days[sourceDay] || [])];
      const [movedShift] = sourceShifts.splice(source.index, 1);
      zoneEmployees[empIndex].days[sourceDay] = sourceShifts;

      movedShift.userChanged = true; // Mark shift as changed
      movedShift.shift_date = getDayName(destDay);
      movedShift.conflict = isEmployeeBusy(newSchedule, employee, destDay);

      const destShifts = zoneEmployees[empIndex].days[destDay] || [];
      zoneEmployees[empIndex].days[destDay] = [...destShifts, movedShift];
    }

    setSchedule(newSchedule);
  }

  //
  // Convert day abbreviation -> actual date string for the selected week
  //
  function getDateForDay(dayAbbrev) {
    const index = DAYS.indexOf(dayAbbrev);
    return weekDates[index]
      ? weekDates[index].toISOString().split('T')[0]
      : '';
  }

  //
  // Delete shift
  //
  function handleDeleteShift(zoneName, employeeName, day, shiftIndex) {
    const newSchedule = { ...schedule };
    const zoneEmployees = newSchedule[zoneName];
    const rowIndex = zoneEmployees.findIndex((row) => row.employee_name === employeeName);
    if (rowIndex !== -1) {
      const cellShifts = [...(zoneEmployees[rowIndex].days[day] || [])];
      cellShifts.splice(shiftIndex, 1);
      zoneEmployees[rowIndex].days[day] = cellShifts;
    }
    setSchedule(newSchedule);
  }

  //
  // Add Shift Modal
  //
  function openAddShiftModal(zoneName, employeeRow, day) {
    setModalData({ zoneName, employeeRow, day });
    setModalOpen(true);
  }

  function handleAddShiftModal(selectedRole) {
    const { zoneName, employeeRow, day } = modalData;
    const uniqueId = `new-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const newShift = {
      id: uniqueId,
      employee_id: employeeRow.employee_id,
      employee_name: employeeRow.employee_name,
      zone_id: employeeRow.zone_id,
      zone_name: employeeRow.zone_name,
      shift_date: getDateForDay(day),
      start_time: '09:00',
      end_time: '17:00',
      role: selectedRole,
      userChanged: true,
      conflict: isEmployeeBusy(schedule, employeeRow.employee_name, day),
      required_count: 1
    };

    const newSchedule = { ...schedule };
    const zoneEmployees = newSchedule[zoneName];
    const index = zoneEmployees.findIndex((row) => row.employee_name === employeeRow.employee_name);
    if (index !== -1) {
      if (!zoneEmployees[index].days[day]) {
        zoneEmployees[index].days[day] = [];
      }
      zoneEmployees[index].days[day].push(newShift);
    }
    setSchedule(newSchedule);
    setModalOpen(false);
    setModalData(null);
  }

  function renderAddShiftModal() {
    if (!modalOpen || !modalData) return null;
    const { employeeRow, day } = modalData;
    const availableRoles =
      employeeRow.availableRoles && employeeRow.availableRoles.length > 0
        ? employeeRow.availableRoles
        : ['Server', 'Bartender', 'Host'];

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
          <h3 className="text-lg font-bold mb-4">Select a Role</h3>
          <p className="mb-4">
            Choose a role for <strong>{employeeRow.employee_name}</strong> on{' '}
            <strong>{day}</strong>.
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
              onClick={() => {
                setModalOpen(false);
                setModalData(null);
              }}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  //
  // No-Show Modal
  //
  function openNoShowModal(shift, zoneName, employeeName, day) {
    const tempId = shift.tempId || `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    shift.tempId = tempId;
    setNoShowModalData({ shift, zoneName, employeeName, day });
    setNoShowModalOpen(true);
  }

  function handleNoShowSubmit({ reason, requestCoverage, selectedCoverage }) {
    const { shift, zoneName, employeeName, day } = noShowModalData;
    const newSchedule = { ...schedule };

    if (newSchedule[zoneName]) {
      const employeeRowIndex = newSchedule[zoneName].findIndex(
        (row) => row.employee_name === employeeName
      );
      if (employeeRowIndex !== -1) {
        const employeeRow = newSchedule[zoneName][employeeRowIndex];
        const shiftIndex = (employeeRow.days[day] || []).findIndex((s) => s.id === shift.id);
        if (shiftIndex !== -1) {
          const updatedShift = {
            ...employeeRow.days[day][shiftIndex],
            noShow: true,
            noShowReason: reason,
            coverageRequested: requestCoverage,
            tempId: shift.tempId,
            status: 'no_show',
            coverageAssigned: requestCoverage && selectedCoverage ? selectedCoverage : undefined,
            userChanged: true
          };
          employeeRow.days[day][shiftIndex] = updatedShift;
        }
      }
    }

    // coverage shift
    if (requestCoverage && selectedCoverage) {
      const coverageRowIndex = newSchedule[zoneName].findIndex(
        (row) => row.employee_name === selectedCoverage
      );
      if (coverageRowIndex !== -1) {
        const coverageRow = newSchedule[zoneName][coverageRowIndex];
        const coverageShift = {
          ...shift,
          id: `coverage-${shift.id || shift.tempId}-${Date.now()}`,
          isCoverage: true,
          originalShiftId: shift.id,
          tempId: shift.tempId,
          status: 'scheduled',
          coverageAssigned: selectedCoverage,
          coveredFor: employeeName,
          coverage_status: 'pending',
          userChanged: true
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
  }

  //
  // Calculate staff required for each day in a zone
  //
  function computeStaffRequiredForZone(employees) {
    const totals = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    employees.forEach((emp) => {
      DAYS.forEach((day) => {
        const shifts = emp.days[day] || [];
        shifts.forEach((shift) => {
          totals[day] += shift.required_count || 0;
        });
      });
    });
    return totals;
  }

  //
  // Collapsible zones
  //
  const [zonesCollapsed, setZonesCollapsed] = useState({});

  function toggleZoneCollapse(zoneName) {
    setZonesCollapsed((prev) => ({
      ...prev,
      [zoneName]: !prev[zoneName]
    }));
  }

  //
  // Render each zone's table
  //
  function renderZone(zoneName) {
    const sortedEmployees = schedule[zoneName].sort((a, b) =>
      a.employee_name.localeCompare(b.employee_name)
    );
    const totals = computeStaffRequiredForZone(sortedEmployees);

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        {!zonesCollapsed[zoneName] && (
          <div className="pt-2">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left pl-4">Employee</th>
                    {weekDates.map((date, idx) => (
                      <th key={idx} className="py-2 text-center">
                        <div>
                          {DAYS[idx]}{' '}
                          {date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedEmployees.map((employeeRow) => (
                    <tr
                      key={employeeRow.employee_name}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-2 font-semibold pl-4">
                        {employeeRow.employee_name}
                      </td>
                      {DAYS.map((day) => {
                        const cellShifts = employeeRow.days[day] || [];
                        const isRest = isEmployeeRestDay(employeeRow, day);

                        return (
                          <td
                            key={day}
                            className={`p-2 text-center align-top ${
                              isRest ? 'bg-gray-100 text-gray-500' : 'bg-white'
                            }`}
                          >
                            <Droppable
                              droppableId={`${employeeRow.employee_name.replace(/\s+/g, '_')}-${day}-${zoneName.replace(
                                /\s+/g,
                                '_'
                              )}`}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className="flex flex-col items-center gap-1 min-h-[40px]"
                                  onClick={() => {
                                    // If empty + not rest day, open Add Shift
                                    if (cellShifts.length === 0 && !isRest) {
                                      openAddShiftModal(zoneName, employeeRow, day);
                                    }
                                  }}
                                >
                                  {cellShifts.map((shift, index) => {
                                    const isNoShow = shift.status === 'no_show';
                                    const isCoverage = shift.isCoverage;

                                    let bgColor = 'bg-green-100';
                                    let textColor = 'text-green-800';
                                    if (isNoShow) {
                                      bgColor = 'bg-red-100';
                                      textColor = 'text-red-800';
                                    } else if (isCoverage) {
                                      bgColor = 'bg-yellow-100';
                                      textColor = 'text-yellow-800';
                                    } else if (isRest) {
                                      bgColor = 'bg-gray-100';
                                      textColor = 'text-gray-500';
                                    }

                                    const roleLabel = shift.role || 'Role?';
                                    let pillText = roleLabel;
                                    if (isNoShow && shift.noShowReason) {
                                      pillText = `${roleLabel} - No Show: ${shift.noShowReason}`;
                                    } else if (isNoShow) {
                                      pillText = `${roleLabel} - No Show`;
                                    } else if (isCoverage) {
                                      pillText = `${roleLabel} (Cover for: ${
                                        shift.coveredFor || '?'
                                      })`;
                                      if (shift.coverage_status) {
                                        pillText += `, Status: ${shift.coverage_status}`;
                                      }
                                    }

                                    return (
                                      <Draggable
                                        key={`shift-${shift.id}`}
                                        draggableId={`shift-${shift.id}`}
                                        index={index}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openNoShowModal(
                                                shift,
                                                zoneName,
                                                employeeRow.employee_name,
                                                day
                                              );
                                            }}
                                            className={`inline-flex items-center px-2 py-1 w-40 rounded-full cursor-pointer ${bgColor} ${textColor}`}
                                            style={{
                                              whiteSpace: 'normal',
                                              wordBreak: 'break-word'
                                            }}
                                          >
                                            <span className="flex-1">
                                              {pillText}
                                            </span>
                                            <button
                                              className="ml-2 text-xs text-red-500"
                                              onClick={(ev) => {
                                                ev.stopPropagation();
                                                handleDeleteShift(
                                                  zoneName,
                                                  employeeRow.employee_name,
                                                  day,
                                                  index
                                                );
                                              }}
                                            >
                                              &times;
                                            </button>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-2 text-right pr-4">Staff Required</td>
                    {DAYS.map((day) => (
                      <td key={day} className="py-2 text-center">
                        {totals[day] || '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DragDropContext>
    );
  }

  //
  // Save confirmation modal
  //
  function renderSaveConfirmationModal() {
    if (!saveSummary) return null;
    const { message, noShowEvents } = saveSummary;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
          <h3 className="text-lg font-bold mb-4">Schedule Saved</h3>
          <p className="mb-2">{message}</p>

          {noShowEvents && noShowEvents.length > 0 ? (
            <table className="w-full mb-4 text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border-b text-left">Day</th>
                  <th className="p-2 border-b text-left">No-Show Employee</th>
                  <th className="p-2 border-b text-left">Covering Employee</th>
                </tr>
              </thead>
              <tbody>
                {noShowEvents.map((ev, index) => {
                  const dayDate = new Date(ev.day);
                  const niceDay = dayDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short'
                  });
                  return (
                    <tr key={index}>
                      <td className="p-2 border-b">{niceDay}</td>
                      <td className="p-2 border-b">{ev.noShowEmployee}</td>
                      <td className="p-2 border-b">
                        {ev.coverageEmployee || 'No coverage assigned'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              No newly marked no‐show shifts this time.
            </p>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setSaveSummary(null)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  //
  // MAIN RENDER
  //
  return (
    <div className="w-full p-6">
      <section className="mb-9">
        <h4 className="text-2xl sm:text-3xl font-bold text-[#222452] mb-1">
          Shift Schedule
        </h4>
        <p className="text-sm text-gray-600 mb-2">
          Schedule new weekly shifts and review previous shift structures. 
          Add No-show records and request for coverage.
        </p>

        {/* Label & dropdown & "How we schedule" */}
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium mr-2">Select Week:</label>
          <select
            value={selectedWeek.toISOString().split('T')[0]}
            onChange={(e) => {
              const newWeek = new Date(e.target.value);
              setSelectedWeek(newWeek);
              handleWeekClick(newWeek);
            }}
            className="p-2 border rounded-full"
          >
            {generateWeekOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            onClick={() => setShowHowWeSchedule(!showHowWeSchedule)}
          >
            How do we schedule your shifts?
          </button>
        </div>

        {showHowWeSchedule && (
          <div className="mt-2 border border-gray-300 p-4 rounded">
            <p className="text-sm">
              Here’s some placeholder text explaining how shifts 
              are automatically generated. 
              Customize as needed for your app!
            </p>
          </div>
        )}

        {/* Button to open date picker for generating schedule */}
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2 mt-4"
        >
          {showDatePicker ? 'Cancel' : 'Select Week to Generate Schedule'}
        </button>

        {showDatePicker && (
          <div className="mt-4">
            <input
              type="date"
              value={selectedWeek.toISOString().split('T')[0]}
              onChange={(e) => {
                const newWeek = new Date(e.target.value);
                setSelectedWeek(newWeek);
              }}
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
      </section>

      {/* If no schedule data, show a message */}
      {Object.keys(schedule).length === 0 ? (
        <p className="text-gray-500">No shifts upcoming for this week.</p>
      ) : (
        <div>
          {Object.keys(schedule)
            .sort()
            .map((zoneName) => (
              <div key={zoneName} className="mb-4 border border-gray-200 rounded">
                <div
                  className="flex items-center justify-between bg-gray-50 p-3 cursor-pointer"
                  onClick={() => toggleZoneCollapse(zoneName)}
                >
                  <span className="font-semibold">{zoneName}</span>
                  <span className="text-sm">
                    {zonesCollapsed[zoneName] ? '▸' : '▾'}
                  </span>
                </div>
                {renderZone(zoneName)}
              </div>
            ))}
        </div>
      )}

      {/* Bottom Save button */}
      <div className="flex flex-col gap-4 mt-6">
        <button
          onClick={handleSaveChanges}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          Save Changes
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {/* Modals */}
      {modalOpen && renderAddShiftModal()}

      {noShowModalOpen && noShowModalData && (
        <NoShowModal
          shift={noShowModalData.shift}
          employeeName={noShowModalData.employeeName}
          day={noShowModalData.day}
          availableCoverageEmployees={allEmployees.filter((emp) => {
            const fullName = `${emp.first_name} ${emp.last_name}`;
            if (fullName === noShowModalData.employeeName) return false;
            const coverDays = (emp.rest_day_coverage || []).map((d) => abbreviateDay(d));
            if (!coverDays.includes(noShowModalData.day)) return false;
            if (isEmployeeBusy(schedule, fullName, noShowModalData.day)) return false;
            return true;
          })}
          onSubmit={handleNoShowSubmit}
          onClose={() => {
            setNoShowModalOpen(false);
            setNoShowModalData(null);
          }}
        />
      )}

      {renderSaveConfirmationModal()}
    </div>
  );
}
