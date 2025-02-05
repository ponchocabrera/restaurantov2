'use client';

import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="md:ml-64">
        {children}
      </main>
    </div>
  );
} 