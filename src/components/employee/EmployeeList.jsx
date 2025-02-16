'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import EmployeeEditModal from './EmployeeEditModal';

const EmployeeListTable = forwardRef((props, ref) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchEmployees
  }));

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (employeeId) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete employee');
      fetchEmployees();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatShiftPreferences = (employee) => {
    // Check and format preferred shifts based on employee.shift_preferences.
    const morningPreferred = employee.shift_preferences?.find(p => p.shift_type === 'morning')?.preferred;
    const afternoonPreferred = employee.shift_preferences?.find(p => p.shift_type === 'afternoon')?.preferred;
    const nightPreferred = employee.shift_preferences?.find(p => p.shift_type === 'night')?.preferred;
    const preferences = [];
    if (morningPreferred) preferences.push('Morning (6am-2pm)');
    if (afternoonPreferred) preferences.push('Afternoon (2pm-10pm)');
    if (nightPreferred) preferences.push('Night (10pm-6am)');
    return preferences.join(', ') || 'No preferences set';
  };

  const formatEmploymentDates = (contractDetails) => {
    if (!contractDetails) return '';
    return `${contractDetails.start_date} - ${contractDetails.end_date || 'Present'}`;
  };

  const formatRoles = (roles) => {
    return roles.filter(r => r !== null).join(', ');
  };

  const formatRestDays = (restDays) => {
    return restDays && restDays.length > 0 ? restDays.join(', ') : 'None';
  };

  const formatCoverage = (coverage) => {
    return coverage && coverage.length > 0 ? coverage.filter(day => day !== null).join(', ') : 'Not available for coverage';
  };

  if (loading) return <div className="text-center py-4">Loading employees...</div>;
  if (error) return <div className="text-red-500 py-4">Error: {error}</div>;
  if (employees.length === 0) return <div className="text-center py-4">No employees found</div>;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Current Employees</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Restaurant</th>
              <th className="border p-2">Days per Week</th>
              <th className="border p-2">Employment Dates</th>
              <th className="border p-2">Shift Preferences</th>
              <th className="border p-2">Rest Days</th>
              <th className="border p-2">Coverage</th>
              <th className="border p-2">Roles</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="border p-2">
                  {employee.first_name} {employee.last_name}
                </td>
                <td className="border p-2">{employee.email}</td>
                <td className="border p-2">{employee.phone}</td>
                <td className="border p-2">{employee.restaurant_name}</td>
                <td className="border p-2">{employee.days_per_week}</td>
                <td className="border p-2">{formatEmploymentDates(employee.contract_details)}</td>
                <td className="border p-2">{formatShiftPreferences(employee)}</td>
                <td className="border p-2">{formatRestDays(employee.rest_days)}</td>
                <td className="border p-2">{formatCoverage(employee.rest_day_coverage)}</td>
                <td className="border p-2">{formatRoles(employee.roles)}</td>
                <td className="border p-2 flex gap-2">
                  <button
                    onClick={() => setEditingEmployee(employee)}
                    className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingEmployee && (
        <EmployeeEditModal 
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={fetchEmployees}
        />
      )}
    </div>
  );
});

export default EmployeeListTable; 