'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function EmployeeForm({ onSuccess }) {
  const { data: session } = useSession();
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const availableRoles = ['server', 'chef', 'host', 'bartender'];

  const [formData, setFormData] = useState({
    restaurant_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    roles: ['server'],
    contract_details: {
      type: 'full-time',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      pto_balance: 20
    },
    days_per_week: 5,
    rest_days: [],
    rest_day_coverage: [],
    shift_preferences: {
      morning: true,    // 6am-2pm
      afternoon: true,  // 2pm-10pm
      night: false      // 10pm-6am
    }
  });

  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('/api/restaurants');
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      const data = await res.json();
      setRestaurants(data.restaurants || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Creating employee...' });
    
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create employee');
      }
      
      const data = await res.json();
      
      // Reset form
      setFormData({
        restaurant_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        roles: ['server'],
        contract_details: {
          type: 'full-time',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          pto_balance: 20
        },
        days_per_week: 5,
        rest_days: [],
        rest_day_coverage: [],
        shift_preferences: {
          morning: true,
          afternoon: true,
          night: false
        }
      });

      setStatus({ type: 'success', message: 'Employee created successfully!' });
      
      // Call onSuccess with the new employee data
      if (onSuccess) {
        onSuccess(data.employee);
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({ type: 'error', message: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Restaurant Selection */}
      <div className="space-y-4">
        <h3 className="font-medium">Restaurant</h3>
        <div className="mb-4">
          <select
            value={formData.restaurant_id}
            onChange={e => setFormData(prev => ({ ...prev, restaurant_id: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Restaurant</option>
            {restaurants.map(restaurant => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="First Name"
          value={formData.first_name}
          onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
          className="p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
          className="p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="p-2 border rounded"
          required
        />
        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="p-2 border rounded"
        />
      </div>

      {/* Roles */}
      <div className="space-y-2">
        <h3 className="font-medium">Roles</h3>
        {formData.roles.map((role, index) => (
          <div key={index} className="flex gap-2">
            <select
              value={role}
              onChange={e => {
                const newRoles = [...formData.roles];
                newRoles[index] = e.target.value;
                setFormData(prev => ({ ...prev, roles: newRoles }));
              }}
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
                onClick={() => {
                  const newRoles = formData.roles.filter((_, i) => i !== index);
                  setFormData(prev => ({ ...prev, roles: newRoles }));
                }}
                className="px-3 py-2 bg-red-500 text-white rounded"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, roles: [...prev.roles, ''] }))}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Add Role
        </button>
      </div>

      {/* Schedule Preferences */}
      <div className="space-y-4">
        <h3 className="font-medium">Schedule Preferences</h3>
        <div>
          <label className="block mb-2">Days per Week</label>
          <input
            type="number"
            min="1"
            max="7"
            value={formData.days_per_week}
            onChange={e => setFormData(prev => ({ ...prev, days_per_week: parseInt(e.target.value) }))}
            className="p-2 border rounded w-20"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Rest Days</h4>
            {daysOfWeek.map(day => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.rest_days.includes(day)}
                  onChange={() => {
                    const newRestDays = formData.rest_days.includes(day)
                      ? formData.rest_days.filter(d => d !== day)
                      : [...formData.rest_days, day];
                    setFormData(prev => ({ ...prev, rest_days: newRestDays }));
                  }}
                  className="mr-2"
                />
                {day}
              </label>
            ))}
          </div>

          <div>
            <h4 className="font-medium mb-2">Available for Coverage</h4>
            {daysOfWeek.map(day => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.rest_day_coverage.includes(day)}
                  onChange={() => {
                    const newCoverage = formData.rest_day_coverage.includes(day)
                      ? formData.rest_day_coverage.filter(d => d !== day)
                      : [...formData.rest_day_coverage, day];
                    setFormData(prev => ({ ...prev, rest_day_coverage: newCoverage }));
                  }}
                  className="mr-2"
                />
                {day}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Shift Preferences</label>
        <div className="mt-2 space-y-2">
          {Object.entries({
            morning: '6am-2pm',
            afternoon: '2pm-10pm',
            night: '10pm-6am'
          }).map(([shift, hours]) => (
            <label key={shift} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.shift_preferences[shift]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  shift_preferences: {
                    ...prev.shift_preferences,
                    [shift]: e.target.checked
                  }
                }))}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600">{hours}</span>
            </label>
          ))}
        </div>
      </div>

      {status.message && (
        <div className={`p-4 rounded ${
          status.type === 'error' ? 'bg-red-100 text-red-700' :
          status.type === 'success' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {status.message}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={status.type === 'loading'}
      >
        {status.type === 'loading' ? 'Creating...' : 'Create Employee'}
      </button>
    </form>
  );
} 