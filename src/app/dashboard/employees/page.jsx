'use client';

import EmployeeForm from '@/components/employee/EmployeeForm';
import EmployeeList from '@/components/employee/EmployeeList';
import { useRef } from 'react';

export default function EmployeesPage() {
  const employeeListRef = useRef();

  const handleEmployeeCreated = () => {
    employeeListRef.current?.fetchEmployees();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Employee Management</h1>
      
      <div className="grid gap-8">
        <EmployeeForm onSuccess={handleEmployeeCreated} />
        <EmployeeList ref={employeeListRef} />
      </div>
    </div>
  );
} 