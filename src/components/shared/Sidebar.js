'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { 
      icon: '/assets/icons/dashboard-icon.svg', 
      label: 'Dashboard', 
      href: '/dashboard' 
    },
    { 
      icon: '/assets/icons/Other 12.png', 
      label: 'Menu Analysis', 
      href: '/menu-analyzer' 
    },
    { 
      icon: '/assets/icons/Other 20.png', 
      label: 'Menu Enhancement', 
      href: '/menu-creator' 
    },
    { 
      icon: '/assets/icons/menu-icon.svg', 
      label: 'Smart Publishing', 
      href: '/menu-generator' 
    },
    { 
      icon: '/assets/icons/settings-icon.svg', 
      label: 'Restaurant Admin', 
      href: '/restaurant-admin' 
    },
    { 
      icon: '/assets/icons/enhance-icon.svg', 
      label: 'Enhance your menu', 
      href: '/templates' 
    }
  ];

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <span className="flex items-center">
          <span className="text-xl font-bold text-gray-900">carte</span>
          <span className="text-xl font-medium text-[#FF7A5C]">.ai</span>
        </span>
      </div>
      
      <nav className="flex-1 flex flex-col p-2 space-y-1">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
              pathname === item.href 
                ? 'bg-[#FF7A5C] text-white' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}>
              <img src={item.icon} alt="" className="w-5 h-5 mr-3" />
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="m-4 flex items-center px-3 py-2 text-red-600 rounded-lg hover:bg-red-50"
      >
        <LogOut className="w-5 h-5 mr-3" />
        Sign Out
      </button>
    </aside>
  );
} 