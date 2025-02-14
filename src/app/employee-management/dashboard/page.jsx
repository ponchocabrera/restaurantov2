'use client';

import Sidebar from '@/components/shared/Sidebar';
import EmployeeList from '@/components/employee/EmployeeList';
import ScheduleManager from '@/components/scheduling/ScheduleManager';

export default function BackofficeDashboard() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64">
        <h1 className="text-3xl font-bold mb-8">Backoffice Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Employee Overview</h2>
            <div className="space-y-2">
              <p>Total Employees: <span className="font-medium">--</span></p>
              <p>Active Contracts: <span className="font-medium">--</span></p>
              <p>Open Positions: <span className="font-medium">--</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Schedule Overview</h2>
            <div className="space-y-2">
              <p>Shifts This Week: <span className="font-medium">--</span></p>
              <p>Open Shifts: <span className="font-medium">--</span></p>
              <p>Coverage Needed: <span className="font-medium">--</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-2 bg-blue-50 rounded hover:bg-blue-100">
                Create New Schedule
              </button>
              <button className="w-full text-left p-2 bg-blue-50 rounded hover:bg-blue-100">
                Review Contracts
              </button>
              <button className="w-full text-left p-2 bg-blue-50 rounded hover:bg-blue-100">
                Generate Reports
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Employee Activity</h2>
            <EmployeeList compact={true} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Upcoming Shifts</h2>
            <ScheduleManager compact={true} />
          </div>
        </div>
      </div>
    </div>
  );
} 