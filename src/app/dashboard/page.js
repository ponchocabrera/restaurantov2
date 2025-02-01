'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/shared/DashboardLayout';

const tools = [
    {
        id: 'menu-creator',
        title: 'Menu Creator',
        description: 'Upload and create your own menu with enhanced AI descriptions and images.',
        icon: '/assets/icons/analytics-icon.svg',
        href: '/menu-creator'
      },
    {
    id: 'menu-generator',
    title: 'Menu Generator',
    description: 'Create beautiful, AI-powered restaurant menus with smart layouts and design.',
    icon: '/assets/icons/menu-icon.svg',
    href: '/menu-generator'
  },
  {
    id: 'menu-analyzer',
    title: 'Menu Analyzer',
    description: 'Analyze your menu performance and get AI-powered recommendations.',
    icon: '/assets/icons/analytics-icon.svg',
    href: '/menu-analyzer'
  }
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Title */}
          <h1 className="text-4xl font-semibold mb-4">Increase your Business Sales and Revenue with AI</h1>
          <p className="text-gray-600 mb-8">Select from our suite of AI-powered restaurant tools.</p>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link 
                key={tool.id} 
                href={tool.href}
                className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={tool.icon} 
                    alt={tool.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h2 className="text-lg font-medium mb-2">{tool.title}</h2>
                <p className="text-gray-600 text-sm">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
