'use client';  // Add this at the top!

import MenuCreator from '@/components/menu-creator/MenuCreator';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function MenuCreatorPage() {
  return (
    <DashboardLayout>
      <main className="min-h-screen bg-white px-8 py-8">
        <MenuCreator />
      </main>
    </DashboardLayout>
  );
}