'use client';

import { useState } from 'react';

export default function EmployeeEditModal({ employee, onClose, onSave }) {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const availableRoles = ['server', 'chef', 'host', 'bartender'];

  const [formData, setFormData] = useState({
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    phone: employee.phone,
    days_per_week: employee.days_per_week,
    rest_days: employee.rest_days || [],
    roles: employee.roles || [],
    contract_details: employee.contract_details || {
      type: 'full-time',
      start_date: '',
      end_date: ''
    },
    shift_preferences: {
      morning: employee.shift_preferences?.morning || false,
      afternoon: employee.shift_preferences?.afternoon || false,
      night: employee.shift_preferences?.night || false,
    }
  });

  const handleRestDayChange = (day) => {
    setFormData(prev => {
      const restDays = prev.rest_days.includes(day)
        ? prev.rest_days.filter(d => d !== day)
        : [...prev.rest_days, day];
      return { ...prev, rest_days: restDays };
    });
  };

  const handleRoleChange = (index, value) => {
    const newRoles = [...formData.roles];
    newRoles[index] = value;
    setFormData(prev => ({ ...prev, roles: newRoles }));
  };

  const addRole = () => {
    setFormData(prev => ({ ...prev, roles: [...prev.roles, ''] }));
  };

  const removeRole = (index) => {
    const newRoles = formData.roles.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, roles: newRoles }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error('Failed to update employee');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Edit Employee</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Days Per Week</label>
              <input
                type="number"
                value={formData.days_per_week}
                onChange={(e) => setFormData(prev => ({ ...prev, days_per_week: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                min="1"
                max="7"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rest Days</label>
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.rest_days.includes(day)}
                      onChange={() => handleRestDayChange(day)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Roles</label>
              {formData.roles.map((role, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(index, e.target.value)}
                    className="p-2 border rounded flex-1"
                    required
                  >
                    <option value="">Select Role</option>
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeRole(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRole}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Add Role
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contract Type</label>
              <select
                value={formData.contract_details.type}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_details: { ...prev.contract_details, type: e.target.value } }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={formData.contract_details.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_details: { ...prev.contract_details, start_date: e.target.value } }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={formData.contract_details.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_details: { ...prev.contract_details, end_date: e.target.value } }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Shift Preferences</label>
              <div className="flex items-center">
                <label className="mr-2">
                  <input
                    type="checkbox"
                    checked={formData.shift_preferences.morning}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shift_preferences: { ...prev.shift_preferences, morning: e.target.checked }
                    }))}
                  />
                  6am-2pm
                </label>
                <label className="mr-2">
                  <input
                    type="checkbox"
                    checked={formData.shift_preferences.afternoon}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shift_preferences: { ...prev.shift_preferences, afternoon: e.target.checked }
                    }))}
                  />
                  2pm-10pm
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.shift_preferences.night}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shift_preferences: { ...prev.shift_preferences, night: e.target.checked }
                    }))}
                  />
                  10pm-6am
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 