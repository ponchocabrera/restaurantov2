'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Users, 
  BookOpen,
  LayoutTemplate,
  Menu,
  HelpCircle,
  Store
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Menu Creator', icon: Menu, path: '/menu-creator' },
    { name: 'Menu Generator', icon: FileText, path: '/menu-generator' },
    { name: 'Menu Publisher', icon: BookOpen, path: '/menu-publisher' },
    { name: 'Restaurant Admin', icon: Store, path: '/restaurant-admin' },
    { name: 'Templates', icon: LayoutTemplate, path: '/templates' },
    { name: 'Support', icon: HelpCircle, path: '/support' }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* Brand/Logo Section */}
      <div className="p-4 font-bold text-lg border-b border-gray-100">
        RestaurantOS
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link 
              key={item.path} 
              href={item.path}
            >
              <span 
                className={`
                  flex items-center px-3 py-2 rounded-lg cursor-pointer
                  ${isActive 
                    ? 'bg-[#FF7A5C] text-white' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              A
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Admin User
            </p>
            <p className="text-xs text-gray-500 truncate">
              admin@restaurantos.com
            </p>
          </div>
          <Settings 
            className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600"
            onClick={() => {/* Add settings handler */}}
          />
        </div>
      </div>
    </aside>
  );
}