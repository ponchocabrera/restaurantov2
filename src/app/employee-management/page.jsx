'use client';

import Sidebar from '@/components/shared/Sidebar';
import ZoneManagement from '@/components/restaurant/ZoneManagement';
import ScheduleManager from '@/components/scheduling/ScheduleManager';
import EmployeeForm from '@/components/employee/EmployeeForm';
import EmployeeList from '@/components/employee/EmployeeList';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function EmployeeManagementPage() {
  const { data: session } = useSession();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Controls whether the "Create Employee" form is visible
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);

  useEffect(() => {
    // If needed, fetch schedules or other data once session is available
  }, [session]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64">
        <h1 className="text-3xl font-bold mb-8">Employee Management</h1>

        {/* Employee List - Moved to top */}
        <div className="mb-8">
          <EmployeeList />
        </div>

        {/* Collapsible Create Employee Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <button
            onClick={() => setIsEmployeeFormOpen((prev) => !prev)}
            className="flex items-center gap-2 text-lg font-semibold text-blue-600 mb-4"
          >
            {isEmployeeFormOpen ? 'Hide Create Employee Form' : 'Create New Employee'}
            <svg
              className={`w-5 h-5 transform transition-transform ${
                isEmployeeFormOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          
          {isEmployeeFormOpen && (
            <div className="mt-4">
              <EmployeeForm />
            </div>
          )}
        </div>

        {/* Zone Management with Existing Zones */}
        <div className="mb-8">
          <ZoneManagement />
        </div>

        {/* Schedule Framework */}
        <div className="mt-8">
          <ScheduleManager />
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
}
