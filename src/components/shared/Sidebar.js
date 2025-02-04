'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Menu, X } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { 
      icon: '/assets/icons/Other 12.png', 
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
      icon: '/assets/icons/Other 20.png', 
      label: 'Restaurant Admin', 
      href: '/restaurant-admin' 
    },
    { 
      icon: '/assets/icons/Other 12.png', 
      label: 'Templates', 
      href: '/templates' 
    },
    { 
      icon: '/assets/icons/Other 12.png', 
      label: 'Support', 
      href: '/support' 
    }
  ];

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <span className="flex items-center">
          <span className="text-xl font-bold text-gray-900">carte</span>
          <span className="text-xl font-medium text-[#FF7A5C]">.ai</span>
        </span>
        {session?.user?.email && (
          <span className="text-sm text-gray-600 mt-2">
            {session.user.email}
          </span>
        )}
      </div>
      
      <nav className="flex-1 flex flex-col p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
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

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-red-600 rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile sidebar */}
      <aside className={`
        md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-200 ease-in-out h-full
      `}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:block fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200">
        <SidebarContent />
      </aside>
    </>
  );
} 