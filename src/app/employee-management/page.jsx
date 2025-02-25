'use client';

import Sidebar from '@/components/shared/Sidebar';
import ZoneManagement from '@/components/restaurant/ZoneManagement';
import ScheduleManager from '@/components/scheduling/ScheduleManager';

export default function EmployeeManagementPage() {
  return (
    <div className="w-full p-6">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64">
        <h1 className="text-2xl sm:text-5xl font-bold font-libre mb-2 sm:mb-4">Make the perfect Schedule. Effortless with AI.</h1>
        <h3 className="text-2xl font-bold mb-4">Shift Scheduler</h3>

        

        <div className="mb-8">
          <ZoneManagement />
        </div>

        <div className="mt-8">
          <ScheduleManager />
        </div>
      </div>
    </div>
  );
}


