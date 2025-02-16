import React from 'react';

const EmployeeUtilization = ({ schedule, employees }) => {
  // Build a map that aggregates the set of days each employee is scheduled for.
  const utilizationMap = {};

  // Iterate over each zone in the schedule.
  if (schedule) {
    Object.values(schedule).forEach(zoneEmployees => {
      zoneEmployees.forEach(employeeRow => {
        const empId = employeeRow.employee_id;
        if (!utilizationMap[empId]) {
          utilizationMap[empId] = new Set();
        }
        // Loop over each day (e.g., Mon, Tue, etc.)
        Object.keys(employeeRow.days).forEach(day => {
          const shifts = employeeRow.days[day];
          if (Array.isArray(shifts) && shifts.length > 0) {
            utilizationMap[empId].add(day);
          }
        });
      });
    });
  }

  // Map over the employees list to calculate utilization.
  // Each employee is expected to have a days_per_week property.
  const utilizationData = employees.map(emp => {
    const scheduledDays = utilizationMap[emp.id] ? utilizationMap[emp.id].size : 0;
    // Use the employee's days_per_week (or default to 7 if not provided)
    const expectedDays = emp.days_per_week || 7;
    const utilizationPercentage = expectedDays ? Math.round((scheduledDays / expectedDays) * 100) : 0;
    
    // Construct a full name (adjust this if your employee object is structured differently)
    const employeeName = emp.first_name && emp.last_name 
      ? `${emp.first_name} ${emp.last_name}` 
      : emp.name || 'Unknown';
    
    return {
      employeeId: emp.id,
      employeeName,
      scheduledDays,
      expectedDays,
      utilizationPercentage
    };
  });

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Employee Utilization</h3>
      {utilizationData.length === 0 ? (
        <p>No utilization data available.</p>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Employee</th>
              <th className="px-4 py-2 border">Scheduled Days</th>
              <th className="px-4 py-2 border">Expected Days</th>
              <th className="px-4 py-2 border">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {utilizationData.map(data => (
              <tr key={data.employeeId}>
                <td className="px-4 py-2 border">{data.employeeName}</td>
                <td className="px-4 py-2 border">{data.scheduledDays}</td>
                <td className="px-4 py-2 border">{data.expectedDays}</td>
                <td className="px-4 py-2 border">{data.utilizationPercentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EmployeeUtilization; 