'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import EmployeeEditModal from './EmployeeEditModal';

const EmployeeList = forwardRef((props, ref) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
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
      fetchEmployees(); // Refresh list
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleDetails = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <div className="text-center py-4">Loading employees...</div>;
  if (error) return <div className="text-red-500 py-4">Error: {error}</div>;
  if (employees.length === 0) return <div className="text-center py-4">No employees found</div>;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Current Employees</h2>
      <div className="grid gap-4">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-all">
            <div 
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleDetails(employee.id)}
            >
              <div className="flex-1">
                <h3 className="font-medium text-lg">{employee.first_name} {employee.last_name}</h3>
                <p className="text-gray-600">{employee.email}</p>
                <div className="mt-1 flex gap-2 flex-wrap">
                  {employee.roles?.filter(r => r !== null).map((role, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingEmployee(employee);
                  }}
                  className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(employee.id);
                  }}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium"
                >
                  Delete
                </button>
                <span className={`transform transition-transform ${
                  expandedId === employee.id ? 'rotate-180' : ''
                }`}>▼</span>
              </div>
            </div>
            
            {expandedId === employee.id && (
              <div className="p-4 border-t bg-gray-50">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employee.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Restaurant</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employee.restaurant_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Days per Week</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employee.days_per_week}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Employment Dates</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {employee.contract_details?.start_date} -{' '}
                      {employee.contract_details?.end_date || 'Present'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Shift Preferences</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {[
                        employee.shift_preferences?.find(p => p.shift_type === 'morning')?.preferred && 'Morning (6am-2pm)',
                        employee.shift_preferences?.find(p => p.shift_type === 'afternoon')?.preferred && 'Afternoon (2pm-10pm)',
                        employee.shift_preferences?.find(p => p.shift_type === 'night')?.preferred && 'Night (10pm-6am)'
                      ].filter(Boolean).join(', ') || 'No preferences set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rest Days</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {employee.rest_days?.join(', ') || 'No rest days set'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Available to Cover</dt>
                    <dd className="mt-1 flex gap-2 flex-wrap">
                      {employee.rest_day_coverage?.filter(d => d !== null).map((day, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          {day}
                        </span>
                      ))}
                      {(!employee.rest_day_coverage || employee.rest_day_coverage.length === 0) && 
                        <span className="text-sm text-gray-500">Not available for coverage</span>
                      }
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        ))}
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

export default EmployeeList; 