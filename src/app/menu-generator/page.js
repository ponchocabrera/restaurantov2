'use client';

import React from 'react';
import Link from 'next/link';
import AIMenuGenerator from '@/components/AIMenuGenerator';
import Sidebar from '../../components/Sidebar';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function MenuGeneratorPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Menu Generator</h1>
        <AIMenuGenerator />
      </div>
    </DashboardLayout>
  );
}