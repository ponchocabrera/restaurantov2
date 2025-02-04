// I don't know why this is here... we probebly need to delete it... but I tried to and something broke in the process

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Users, 
  BookOpen,
  LayoutTemplate,
  Menu,
  HelpCircle,
  Store,
  LogOut
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

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Brand/Logo Section */}
      <div className="p-4 font-bold text-lg border-b border-gray-100">
        RestaurantOS
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col p-2 space-y-1">
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

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-red-600 rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}