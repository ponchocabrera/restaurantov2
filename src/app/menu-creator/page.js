'use client';  // Add this at the top!

import MenuCreator from '@/components/menu-creator/MenuCreator';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function MenuCreatorPage() {
  return (
    <DashboardLayout>
      <main className="container mx-auto">
        <MenuCreator />
      </main>
    </DashboardLayout>
  );
}