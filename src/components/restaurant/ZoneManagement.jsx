'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ZoneManagement() {
  const { data: session } = useSession();

  // -------------------------
  // State and constants
  // -------------------------
  const [zones, setZones] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [expandedZone, setExpandedZone] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingZone, setIsAddingZone] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const roles = ['server', 'chef', 'host', 'bartender'];
  const shifts = ['morning', 'afternoon', 'evening'];

  // -------------------------
  // Initial requirements
  // -------------------------
  const createInitialRequirements = () => {
    const requirements = {};
    daysOfWeek.forEach(day => {
      requirements[day] = {};
      roles.forEach(role => {
        requirements[day][role] = {
          morning: 0,
          afternoon: 0,
          evening: 0
        };
      });
    });
    return requirements;
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requirements: createInitialRequirements()
  });

  // -------------------------
  // Handlers
  // -------------------------
  const handleRequirementChange = (day, role, shift, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [day]: {
          ...prev.requirements[day],
          [role]: {
            ...prev.requirements[day][role],
            [shift]: parseInt(value) || 0
          }
        }
      }
    }));
  };

  const createZone = async () => {
    try {
      setStatus({ type: 'loading', message: 'Saving zone...' });

      // Transform requirements -> roles_needed
      const rolesNeeded = [];
      Object.entries(formData.requirements).forEach(([day, roles]) => {
        Object.entries(roles).forEach(([role, shifts]) => {
          Object.entries(shifts).forEach(([shift, count]) => {
            if (count > 0) {
              rolesNeeded.push({
                day_of_week: day,
                role: role,
                required_count: count,
                shift_time: shift,
                shift_start:
                  shift === 'morning'
                    ? '09:00'
                    : shift === 'afternoon'
                    ? '14:00'
                    : '18:00',
                shift_end:
                  shift === 'morning'
                    ? '14:00'
                    : shift === 'afternoon'
                    ? '18:00'
                    : '23:00'
              });
            }
          });
        });
      });

      const zoneData = {
        name: formData.name,
        description: formData.description,
        roles_needed: rolesNeeded
      };

      const res = await fetch('/api/restaurant-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneData)
      });

      if (!res.ok) throw new Error('Failed to create zone');

      setStatus({ type: 'success', message: 'Zone created successfully!' });
      // Reset form
      setFormData({
        name: '',
        description: '',
        requirements: createInitialRequirements()
      });
    } catch (error) {
      console.error('Error:', error);
      setStatus({ type: 'error', message: error.message });
    }
  };

  // -------------------------
  // Fetch zones
  // -------------------------
  useEffect(() => {
    if (session) {
      fetchZones();
    }
  }, [session]);

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/restaurant-zones');
      if (!res.ok) throw new Error('Failed to fetch zones');
      const data = await res.json();
      setZones(data.zones);
    } catch (error) {
      console.error('Error fetching zones:', error);
      setStatus({ type: 'error', message: 'Failed to load zones' });
    }
  };

  // -------------------------
  // Render existing zones
  // -------------------------
  const renderExistingZones = () => {
    return (
      <div>
        {zones.map((zone) => {
          const isZoneExpanded = expandedZone === zone.id;

          return (
            <div key={zone.id} className="rounded mb-3">
              {/* 
                Each zone's header row 
                Gray background, big button area, caret on right 
                Blue border if expanded
              */}
              <button
                onClick={() =>
                  setExpandedZone(isZoneExpanded ? null : zone.id)
                }
                className={`
                  w-full flex items-center justify-between 
                  px-4 py-3 rounded 
                  text-left 
                  transition-colors
                  ${isZoneExpanded 
                    ? 'border-2 border-blue-500 bg-gray-100' 
                    : 'bg-gray-100 border border-transparent'}
                `}
              >
                <span className="font-medium text-sm sm:text-base">
                  {zone.name || 'Zone (Name of the Zone)'}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transform transition-transform ${
                    isZoneExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>

              {/* Expanded content */}
              {isZoneExpanded && (
                <div className="bg-gray-50 border border-gray-200 rounded-b p-4">
                  <p className="text-gray-600 mb-4">
                    {zone.description}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2 text-sm">Day</th>
                          <th className="border p-2 text-sm">Role</th>
                          <th className="border p-2 text-sm">Shift</th>
                          <th className="border p-2 text-sm">Time</th>
                          <th className="border p-2 text-sm">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(zone.roles_needed || []).map((role, idx) => (
                          <tr key={idx}>
                            <td className="border p-2 text-sm">
                              {role.day_of_week}
                            </td>
                            <td className="border p-2 text-sm">
                              {role.role}
                            </td>
                            <td className="border p-2 text-sm">
                              {role.shift_time}
                            </td>
                            <td className="border p-2 text-sm">
                              {role.shift_start} - {role.shift_end}
                            </td>
                            <td className="border p-2 text-sm">
                              {role.required_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(zone);
                      }}
                      className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // -------------------------
  // Delete
  // -------------------------
  const handleDeleteZone = async (id) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;
    try {
      setStatus({ type: 'loading', message: 'Deleting zone...' });
      const res = await fetch(`/api/restaurant-zones/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete zone');

      setStatus({ type: 'success', message: 'Zone deleted successfully!' });
      fetchZones(); // Refresh the zones list
    } catch (error) {
      console.error('Error:', error);
      setStatus({ type: 'error', message: error.message });
    }
  };

  // -------------------------
  // Edit
  // -------------------------
  const handleEdit = (zone) => {
    setEditingZone(zone);
    setIsEditing(true);
    setIsAddingZone(true);

    // Transform zone requirements to match form structure
    const requirements = createInitialRequirements();
    (zone.roles_needed || [])
      .filter(({ required_count }) => required_count > 0)
      .forEach(({ day_of_week, role, required_count, shift_time }) => {
        if (!day_of_week) return;
        // Make sure the day_of_week is properly capitalized
        const day = day_of_week.charAt(0).toUpperCase() + 
                    day_of_week.slice(1).toLowerCase();
        requirements[day][role][shift_time] = required_count;
      });

    setFormData({
      name: zone.name,
      description: zone.description,
      requirements
    });
  };

  // -------------------------
  // Create / Update Submit
  // -------------------------
  const handleSubmit = async () => {
    try {
      const url = isEditing 
        ? `/api/restaurant-zones/${editingZone.id}`
        : '/api/restaurant-zones';

      const method = isEditing ? 'PUT' : 'POST';

      const roles_needed = [];
      Object.entries(formData.requirements).forEach(([day, roles]) => {
        Object.entries(roles).forEach(([role, shifts]) => {
          Object.entries(shifts).forEach(([shift, count]) => {
            if (count > 0) {
              roles_needed.push({
                day_of_week: day.toLowerCase(),
                role,
                required_count: count,
                shift_time: shift,
                shift_start: '08:00',
                shift_end: '16:00'
              });
            }
          });
        });
      });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          roles_needed
        }),
      });

      if (!res.ok) {
        throw new Error(
          isEditing ? 'Failed to update zone' : 'Failed to create zone'
        );
      }

      // Success: refresh & reset
      fetchZones();
      setIsAddingZone(false);
      setEditingZone(null);
      setIsEditing(false);

    } catch (error) {
      console.error('Error:', error);
      setStatus({ type: 'error', message: error.message });
    }
  };

  // -------------------------
  // Main render
  // -------------------------
  return (
    <div className="space-y-6">

      {/* Heading */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#222452] mb-1">
          Restaurant Zones
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Set up your Restaurant Zones and add the required employees 
          to fit your daily demand.
        </p>
      </div>

      {/* Button to show/hide the "Add Zone" form */}
      <div>
        <button
          onClick={() => setIsAddingZone(!isAddingZone)}
          className="inline-flex items-center gap-2 px-4 py-2 
                     text-[#222452] rounded-md bg-gray-200 
                     hover:bg-gray-300 font-medium"
        >
          {isAddingZone ? 'Cancel' : 'Add New Restaurant Zones'}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform ${
              isAddingZone ? 'rotate-180' : ''
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586 
                 l3.293-3.293a1 1 0 011.414 1.414
                 l-4 4a1 1 0 01-1.414 0l-4-4a1 1 
                 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* The add/edit form when toggled */}
      {isAddingZone && (
        <div className="border rounded-lg shadow-sm p-4 bg-white space-y-4">
          <div>
            <label className="block mb-2 font-medium">Zone Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full p-2 border rounded"
              placeholder="e.g. Patio, Bar, Dining Room"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value
                }))
              }
              className="w-full p-2 border rounded"
              placeholder="Optional description..."
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Day</th>
                  {roles.map(role => (
                    <th key={role} className="border p-2 text-center" colSpan={3}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="border p-2"></th>
                  {roles.map(role => (
                    shifts.map(shift => (
                      <th key={`${role}-${shift}`} className="border p-2 text-center">
                        {shift.charAt(0).toUpperCase() + shift.slice(1)}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {daysOfWeek.map(day => (
                  <tr key={day}>
                    <td className="border p-2 font-medium">{day}</td>
                    {roles.map(role => (
                      shifts.map(shift => (
                        <td key={`${day}-${role}-${shift}`} className="border p-2">
                          <input
                            type="number"
                            min="0"
                            value={formData.requirements[day][role]?.[shift] || 0}
                            onChange={(e) =>
                              handleRequirementChange(day, role, shift, e.target.value)
                            }
                            className="w-16 p-1 border rounded text-center"
                          />
                        </td>
                      ))
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSubmit}
            className="bg-[#222452] text-white px-4 py-2 
                       rounded hover:opacity-90 font-semibold"
          >
            {isEditing ? 'Update Zone' : 'Create Zone'}
          </button>
        </div>
      )}

      {/* Status messages */}
      {status.message && (
        <div
          className={`p-2 text-sm rounded ${
            status.type === 'error'
              ? 'bg-red-100 text-red-700'
              : status.type === 'success'
              ? 'bg-green-100 text-green-700'
              : status.type === 'loading'
              ? 'bg-yellow-100 text-yellow-700'
              : ''
          }`}
        >
          {status.message}
        </div>
      )}

      {/* List existing zones */}
      {zones.length > 0 && (
        <div className="mt-4">
          {renderExistingZones()}
        </div>
      )}
    </div>
  );
}
