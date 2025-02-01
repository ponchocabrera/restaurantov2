'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: '⚡', label: 'Dashboard', href: '/dashboard' },
    { icon: '📝', label: 'Menu Creator', href: '/menu-creator' },
    { icon: '🤖', label: 'Menu Generator', href: '/menu-generator' },
    { icon: '📢', label: 'Menu Publisher', href: '/menu-publisher' },
    { icon: '⚙️', label: 'Restaurant Admin', href: '/restaurant-admin' },
    { icon: '📋', label: 'Enhance your menu', href: '/templates' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 font-bold text-lg border-b border-gray-100">
        RestaurantOS
      </div>
      <nav className="flex flex-col p-2 space-y-1">
        {menuItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
          >
            <span className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
              pathname === item.href 
                ? 'bg-[#FF7A5C] text-white' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}>
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
} 