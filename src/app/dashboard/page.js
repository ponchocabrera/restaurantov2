'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/shared/DashboardLayout';

const tools = [
  {
    id: 'menu-analyzer',
    title: 'Menu Analysis',
    description: 'Upload your current Menu and get instant, research-backed recommendations for improvement.',
    features: [
      'Scientific Analysis of layout and design',
      'Color scheme analysis',
      'Psychological impact review'
    ],
    icon: '/assets/icons/Other 12.png',
    href: '/menu-analyzer'
  },  
  
  {
        id: 'menu-creator',
        title: 'AI Menu Enhancement',
        description: 'Transform your menu with AI-powered descriptions and professional visuals.',
        features: [
          'Compelling item descriptions',
          'Professional food imagery',
          'Psychological triggers applied'
        ],
        icon: '/assets/icons/Other 20.png',
        href: '/menu-creator'
      },
    {
    id: 'menu-generator',
    title: 'Smart Publishing',
    description: 'Generate beautiful, high-converting menus that are ready to print or share digitally',
    features: [
      'Print-ready design',
      'Digital-optimized versions',
      'Easy update system'
    ],
    icon: '/assets/icons/menu-icon.svg',
    href: '/menu-generator'
  },

  {
    id: 'menu-generator',
    title: '[Coming soon] Revenue Impact Tracker',
    description: 'See the real impact on your bottom line with our AI Menu Intelligence',
    features: [
      'Increased average ticket',
      'Higher-margin item sales',
      'Better customer experience'
    ],
    icon: '/assets/icons/menu-icon.svg',
    href: '/menu-generator'
  }
  
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Title */}
          <h1 className="text-4xl font-semibold mb-4">Transform your Menu into a Revenue Engine</h1>
          <p className="text-gray-600 mb-8">From Analysis to Optimization, in three simple steps. All done by Artificial Intelligence.</p>

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
                <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                <ul className="space-y-2">
                  {tool.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="text-[#FF7A5C] mr-2">→</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
