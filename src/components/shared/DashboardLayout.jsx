'use client';

import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar className="h-screen" />
      <main className="flex-1 bg-white">
        {children}
      </main>
    </div>
  );
}