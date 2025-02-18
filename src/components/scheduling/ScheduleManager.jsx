'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import NoShowModal from './NoShowModal';
import { startOfWeek, format } from 'date-fns';
import { SHIFT_TIMES } from '@/lib/scheduling/scheduleConfigurations';
import EmployeeUtilization from './EmployeeUtilization';
import ZoneFillingStatus from './ZoneFillingStatus';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Utility to abbreviate day names
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

const getCurrentWeekStart = (date) => startOfWeek(date, { weekStartsOn: 1 });

// Check if employee is busy for a given day
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

// Parse "HH:MM" into total minutes
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Decide which block a shift belongs to
export function getShiftBlock(shift) {
  const startTime = shift.start_time || '00:00';
  const startMinutes = parseTime(startTime);

  const morningStart = parseTime(SHIFT_TIMES.morning.start);
  const morningEnd   = parseTime(SHIFT_TIMES.morning.end);
  const afternoonStart = parseTime(SHIFT_TIMES.afternoon.start);
  const afternoonEnd   = parseTime(SHIFT_TIMES.afternoon.end);
  const eveningStart   = parseTime(SHIFT_TIMES.evening.start);
  const eveningEnd     = parseTime(SHIFT_TIMES.evening.end);

  if (startMinutes >= morningStart && startMinutes < morningEnd) {
    return 'Morning';
  } else if (startMinutes >= afternoonStart && startMinutes < afternoonEnd) {
    return 'Afternoon';
  } else if (startMinutes >= eveningStart && startMinutes < eveningEnd) {
    return 'Evening';
  }
  return 'Other';
}

function getShiftTimes(shift) {
  if (SHIFT_TIMES[shift]) {
    return {
      shift_start: SHIFT_TIMES[shift].start,
      shift_end: SHIFT_TIMES[shift].end
    };
  }
  return { shift_start: '00:00', shift_end: '00:00' };
}

export default function ScheduleManager({ compact }) {
  const { data: session } = useSession();

  const [zonesCollapsed, setZonesCollapsed] = useState({});
  const [schedule, setSchedule] = useState({});
  const [generatedWeeks, setGeneratedWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekStart(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [employeeRestDaysMapping, setEmployeeRestDaysMapping] = useState({});
  const [employeeRolesMapping, setEmployeeRolesMapping] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
  const [noShowModalData, setNoShowModalData] = useState(null);
  const [saveSummary, setSaveSummary] = useState(null);
  const [showHowWeSchedule, setShowHowWeSchedule] = useState(false);
  const [zoneRequirements, setZoneRequirements] = useState({});
  const [selectedShiftType, setSelectedShiftType] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  const zones = Object.keys(schedule);

  // Fetch all employees on mount
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
          rolesMap[fullName] =
            emp.roles && emp.roles.length > 0
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
    const restDays = employeeRow.restDays || employeeRow.rest_days || [];
    return restDays.includes(day);
  }

  // Fetch list of generated weeks
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

  function getDayName(dateStr) {
    const date = new Date(dateStr);
    const mapping = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return mapping[date.getDay()];
  }

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
          coverageAssigned: shift.covered_assigned,
          noShowReason: shift.no_show_reason,
          coverage_status: shift.coverage_status
        });
      }
    }
    return grouped;
  }

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

  // Fetch schedule for a given start date
  async function handleWeekClick(weekStart) {
    setLoading(true);
    setError('');
    try {
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

  // On first mount, fetch the default week's schedule
  useEffect(() => {
    handleWeekClick(selectedWeek);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate new schedule for the selected week
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

      await handleWeekClick(selectedWeek);

      setGeneratedWeeks((prev) => [
        ...new Set([...prev, selectedWeek.toISOString().split('T')[0]])
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteWeek() {
    if (!confirm('Are you sure you want to delete this schedule? This cannot be undone!')) {
      return;
    }

    try {
      setLoading(true);
      const weekStr = selectedWeek.toISOString().split('T')[0];
      const response = await fetch('/api/schedules/weeks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart: weekStr })
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      setGeneratedWeeks((prev) => prev.filter((w) => w !== weekStr));
      setSchedule({});

      alert('Schedule deleted successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Flatten out the schedule for saving
  async function handleSaveChanges() {
    const shiftsToSave = [];
    for (const zoneName in schedule) {
      const zoneEmployees = schedule[zoneName];
      zoneEmployees.forEach((employee) => {
        DAYS.forEach((day) => {
          (employee.days[day] || []).forEach((shift) => {
            shiftsToSave.push(shift);
          });
        });
      });
    }

    try {
      const response = await fetch('/api/schedules/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shifts: shiftsToSave,
          startDate: selectedWeek.toISOString().split('T')[0],
          endDate: new Date(selectedWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save schedule');
      }

      // Force a fresh fetch so UI updates right away:
      await handleWeekClick(selectedWeek);

      setSaveSummary({ message: 'Schedule saved successfully!' });
    } catch (error) {
      setError(error.message);
    }
  }

  // Generate <option> list for week selection
  function generateWeekOptions() {
    const currentWeekStr = selectedWeek.toISOString().split('T')[0];
    const allWeeks = new Set([...generatedWeeks, currentWeekStr]);
    const sortedWeeks = Array.from(allWeeks).sort((a, b) => new Date(a) - new Date(b));

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

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedWeek);
    d.setDate(selectedWeek.getDate() + i);
    return d;
  });

  function getDateForDay(dayAbbrev) {
    const idx = DAYS.indexOf(dayAbbrev);
    if (idx < 0) return '';
    return weekDates[idx].toISOString().split('T')[0];
  }

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

    // We only allow reordering within the same droppable
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

      movedShift.userChanged = true;
      movedShift.shift_date = getDateForDay(destDay);
      movedShift.conflict = isEmployeeBusy(newSchedule, employee, destDay);

      const destShifts = zoneEmployees[empIndex].days[destDay] || [];
      zoneEmployees[empIndex].days[destDay] = [...destShifts, movedShift];
    }

    setSchedule(newSchedule);
  }

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

 

  function openAddShiftModal(zoneName, employeeRow, day) {
    setModalData({ zoneName, employeeRow, day });
    setSelectedShiftType(null);
    setSelectedRole(null);
    setModalOpen(true);
  }

  function handleConfirmAddShift() {
    const { zoneName, employeeRow, day } = modalData;
    const uniqueId = `new-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const { shift_start, shift_end } = getShiftTimes(selectedShiftType);

    const newShift = {
      id: uniqueId,
      employee_id: employeeRow.employee_id,
      employee_name: employeeRow.employee_name,
      zone_id: employeeRow.zone_id,
      zone_name: employeeRow.zone_name,
      shift_date: getDateForDay(day),
      start_time: shift_start,
      end_time: shift_end,
      role: selectedRole || 'Role?',
      userChanged: true,
      conflict: isEmployeeBusy(schedule, employeeRow.employee_name, day),
      required_count: 1
    };

    setSchedule((prev) => ({
      ...prev,
      [zoneName]: prev[zoneName].map((emp) => {
        if (emp.employee_name === employeeRow.employee_name) {
          return {
            ...emp,
            days: {
              ...emp.days,
              [day]: [...(emp.days[day] || []), newShift]
            }
          };
        }
        return emp;
      })
    }));

    setModalOpen(false);
    setModalData(null);
    setSelectedShiftType(null);
    setSelectedRole(null);
  }

  function renderAddShiftModal() {
    if (!modalOpen || !modalData) return null;
    const { employeeRow, day } = modalData;
    const shiftOptions = ['morning', 'afternoon', 'evening'];
    const roleOptions =
      employeeRolesMapping[employeeRow.employee_name] &&
      employeeRolesMapping[employeeRow.employee_name].length > 0
        ? employeeRolesMapping[employeeRow.employee_name]
        : ['barman', 'server'];

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
          <h3 className="text-lg font-bold mb-4">Add Shift</h3>
          <p className="mb-4">
            Select shift type and role for <strong>{employeeRow.employee_name}</strong> on <strong>{day}</strong>.
          </p>

          <div className="mb-4">
            <p className="font-semibold">Select Shift Type:</p>
            <div className="space-x-2 mt-2">
              {shiftOptions.map((shift) => (
                <button
                  key={shift}
                  onClick={() => setSelectedShiftType(shift)}
                  className={`px-3 py-1 rounded ${
                    selectedShiftType === shift
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {shift.charAt(0).toUpperCase() + shift.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="font-semibold">Select Role:</p>
            <div className="space-x-2 mt-2">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1 rounded ${
                    selectedRole === role
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setModalOpen(false);
                setModalData(null);
                setSelectedShiftType(null);
                setSelectedRole(null);
              }}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAddShift}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!selectedShiftType || !selectedRole}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }


  function openNoShowModal(shift, zoneName, employeeName, day) {
    const tempId = shift.tempId || `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    shift.tempId = tempId;
    setNoShowModalData({ shift, zoneName, employeeName, day });
    setNoShowModalOpen(true);
  }

  function handleNoShowSubmit({ reason, requestCoverage, selectedCoverage, notifyMethod }) {
    const { shift, zoneName, employeeName, day } = noShowModalData;
    const newSchedule = { ...schedule };

    // Mark the shift as no-show
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
            userChanged: true,
            notificationMethod: notifyMethod
          };
          employeeRow.days[day][shiftIndex] = updatedShift;
        }
      }
    }

    // If coverage is requested, create a coverage shift for the assigned employee
    if (requestCoverage && selectedCoverage) {
      const coverageRowIndex = newSchedule[zoneName].findIndex(
        (row) => row.employee_name === selectedCoverage
      );
      if (coverageRowIndex !== -1) {
        const coverageRow = newSchedule[zoneName][coverageRowIndex];
        const shiftBlock = getShiftBlock(shift).toLowerCase();
        const shiftTimes = SHIFT_TIMES[shiftBlock];

        const coverageShift = {
          ...shift,
          id: `coverage-${shift.id || shift.tempId}-${Date.now()}`,
          isCoverage: true,
          originalShiftId: shift.id,
          tempId: shift.tempId,
          status: 'scheduled',
          coveredFor: employeeName,
          userChanged: true,
          coverage_status:
            notifyMethod === 'call'
              ? 'pending'
              : notifyMethod === 'sms'
              ? 'notified'
              : 'pending',

          // Times from SHIFT_TIMES based on the block
          start_time: shiftTimes.start,
          end_time: shiftTimes.end,

          // Assign coverage employee's data
          employee_id: coverageRow.employee_id,
          employee_name: coverageRow.employee_name,
          zone_id: coverageRow.zone_id,
          zone_name: coverageRow.zone_name,

          coverageAssigned: selectedCoverage
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

  function renderSaveConfirmationModal() {
    if (!saveSummary) return null;
    const { message, noShowEvents } = saveSummary;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
          <h3 className="text-lg font-bold mb-4">Schedule Saved</h3>
          <p className="mb-2">{message}</p>

          {noShowEvents && noShowEvents.length > 0 ? (
            <div className="overflow-x-auto w-full mb-4">
              <table className="table-fixed min-w-[400px] text-xs sm:text-sm border">
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
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              No newly marked no-show shifts this time.
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

  // Renders each zone (and each shift block inside that zone)
  function renderZone(zoneName) {
    if (!Array.isArray(schedule[zoneName])) return null;
    const zoneEmployees = schedule[zoneName].filter(
      (emp) => emp && typeof emp.employee_name === 'string'
    );
    const sortedEmployees = zoneEmployees.sort((a, b) =>
      a.employee_name.localeCompare(b.employee_name)
    );

    const blockSet = new Set();
    sortedEmployees.forEach((emp) => {
      DAYS.forEach((day) => {
        (emp.days[day] || []).forEach((shift) => {
          blockSet.add(getShiftBlock(shift));
        });
      });
    });

    // For each block, create a sub-table
    const blockTables = Array.from(blockSet).sort().map((block) => {
      const filtered = sortedEmployees.map((emp) => {
        const newDays = {};
        DAYS.forEach((day) => {
          const shifts = emp.days[day] || [];
          newDays[day] = shifts.filter((s) => getShiftBlock(s) === block);
        });
        return { ...emp, days: newDays };
      });

      const finalEmployees = filtered.filter((emp) =>
        DAYS.some((day) => emp.days[day] && emp.days[day].length > 0)
      );
      if (!finalEmployees.length) return null;

      const totals = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      finalEmployees.forEach((emp) => {
        DAYS.forEach((day) => {
          (emp.days[day] || []).forEach((shift) => {
            totals[day] += shift.required_count || 0;
          });
        });
      });

      return (
        <div key={block} className="my-4 border rounded">
          <div className="bg-gray-50 p-2 font-semibold">
            {zoneName} — {block}
          </div>
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Horizontal scroll container */}
            <div className="overflow-x-auto w-full">
              <table className="table-fixed w-full min-w-[700px] text-xs sm:text-sm border-collapse">
                <colgroup>
                  <col style={{ width: '15%' }} />
                  {DAYS.map((_, idx) => (
                    <col key={idx} style={{ width: `${(85 / 7).toFixed(2)}%` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left pl-4">Employee</th>
                    {weekDates.map((date, idx) => (
                      <th key={idx} className="py-2 text-center">
                        {DAYS[idx]}{' '}
                        {date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {finalEmployees.map((employeeRow) => (
                    <tr
                      key={employeeRow.employee_name}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-2 font-semibold pl-4">{employeeRow.employee_name}</td>
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
                                    const shiftTimes =
                                      shift.start_time && shift.end_time
                                        ? ` (${shift.start_time} - ${shift.end_time})`
                                        : '';
                                    let pillText = `${roleLabel}${shiftTimes}`;

                                    if (isNoShow && shift.noShowReason) {
                                      pillText += ` - No Show: ${shift.noShowReason}`;
                                    } else if (isNoShow) {
                                      pillText += ` - No Show`;
                                    } else if (isCoverage) {
                                      pillText += ` (Cover for: ${shift.coveredFor || '?'}`;
                                      if (shift.coverage_status) {
                                        pillText += `, Status: ${shift.coverage_status}`;
                                      }
                                      pillText += `)`;
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
                                            className={`inline-flex items-center px-2 py-1 w-full rounded-sm cursor-pointer ${bgColor} ${textColor}`}
                                            style={{
                                              whiteSpace: 'normal',
                                              wordBreak: 'break-word'
                                            }}
                                          >
                                            <span className="flex-1">{pillText}</span>
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
          </DragDropContext>
        </div>
      );
    });

    if (blockTables.every((x) => x === null)) return null;
    return <div className="pt-2">{!zonesCollapsed[zoneName] && blockTables}</div>;
  }

  return (
    <div className="w-full p-6">
      <section className="mb-9">
        <h4 className="text-2xl sm:text-3xl font-bold text-[#222452] mb-1">
          Shift Schedule
        </h4>
        <p className="text-sm text-gray-600 mb-2">
          Schedule new weekly shifts and review previous shift structures. 
          Add No-show records and request coverage.
        </p>

        <div className="flex items-center flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium mr-2">Select Week:</label>
            <select
              value={selectedWeek.toISOString().split('T')[0]}
              onChange={(e) => {
                const newWeek = new Date(e.target.value);
                setSelectedWeek(newWeek);
                handleWeekClick(newWeek);
              }}
              className="p-2 border rounded-full text-sm"
            >
              {generateWeekOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleDeleteWeek}
              className="p-2 text-red-500 hover:text-red-700"
              title="Delete this schedule"
              disabled={!generatedWeeks.includes(selectedWeek.toISOString().split('T')[0])}
            >
              🗑️ Delete
            </button>
          </div>

          <button
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
            onClick={() => setShowHowWeSchedule(!showHowWeSchedule)}
          >
            How do we schedule your shifts?
          </button>
        </div>

        {showHowWeSchedule && (
          <div className="mt-2 border border-gray-300 p-4 rounded text-sm">
            <p>
              Here's some placeholder text explaining how shifts 
              are automatically generated. 
              Customize as needed for your app!
            </p>
          </div>
        )}

        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2 mt-4 text-sm"
        >
          {showDatePicker ? 'Cancel' : 'Select Week to Generate Schedule'}
        </button>

        {showDatePicker && (
          <div className="mt-4 flex items-center gap-2">
            <input
              type="date"
              value={selectedWeek.toISOString().split('T')[0]}
              onChange={(e) => {
                const newWeek = new Date(e.target.value);
                setSelectedWeek(newWeek);
              }}
              className="border rounded p-2 text-sm"
            />
            <button
              onClick={handleGenerateSchedule}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Generate Schedule'}
            </button>
          </div>
        )}
      </section>

      {Object.keys(schedule || {}).length === 0 ? (
        <p className="text-gray-500">No shifts upcoming for this week.</p>
      ) : (
        <div>
          {zones.map((zoneName) => (
            <div key={zoneName} className="mb-4 border border-gray-200 rounded">
              <div
                className="flex items-center justify-between bg-gray-50 p-3 cursor-pointer"
                onClick={() =>
                  setZonesCollapsed((prev) => ({
                    ...prev,
                    [zoneName]: !prev[zoneName]
                  }))
                }
              >
                <span className="font-semibold">{zoneName}</span>
                <span className="text-sm">
                  {zonesCollapsed[zoneName] ? '▸' : '▾'}
                </span>
              </div>

              {!zonesCollapsed[zoneName] && renderZone(zoneName)}
            </div>
          ))}
        </div>
      )}

      <EmployeeUtilization schedule={schedule} employees={allEmployees} />
      <ZoneFillingStatus schedule={schedule} zoneRequirements={zoneRequirements} />

      <div className="flex flex-col gap-4 mt-6">
        <button
          onClick={handleSaveChanges}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
        >
          Save Changes
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

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
