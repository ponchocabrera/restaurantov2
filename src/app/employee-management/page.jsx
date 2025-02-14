'use client';

import Sidebar from '@/components/shared/Sidebar';
import ZoneManagement from '@/components/restaurant/ZoneManagement';
import ScheduleManager from '@/components/scheduling/ScheduleManager';

export default function EmployeeManagementPage() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64">
        <h1 className="text-3xl font-bold mb-8">Schedule & Zone Management</h1>

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
