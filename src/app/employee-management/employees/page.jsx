'use client';

import Sidebar from '@/components/shared/Sidebar';
import EmployeeList from '@/components/employee/EmployeeList';
import EmployeeForm from '@/components/employee/EmployeeForm';
import { useState } from 'react';

export default function EmployeePage() {
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64">
        <h1 className="text-3xl font-bold mb-8">Employee Directory</h1>

        <div className="mb-8">
          <EmployeeList />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={() => setIsEmployeeFormOpen((prev) => !prev)}
            className="flex items-center gap-2 text-lg font-semibold text-blue-600 mb-4"
          >
            {isEmployeeFormOpen ? 'Hide Form' : 'Create New Employee'}
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
      </div>
    </div>
  );
} 