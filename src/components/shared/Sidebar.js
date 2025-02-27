'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Menu, X } from 'lucide-react';
import LanguageToggle from "../LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import Logo from "@/components/Sidebar/Logo";

export default function Sidebar() {
  const { language } = useLanguage();
  const t = language === "es" ? es.sidebar : en.sidebar;
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { key: "Home", href: "/dashboard" },
    { key: "yourRestaurant", href: "/my-restaurants" },
    { key: "menuAnalysis", href: "/menu-analyzer" },
    { key: "menuEnhancement", href: "/menu-creator" },
    { key: "restaurantAdmin", href: "/restaurant-admin" },
    { 
      key: "backOffice", 
      href: "/employee-management/dashboard",
      children: [
        { key: "employeeContracts", href: "/employee-management/employees" },
        { key: "scheduler", href: "/employee-management" }
      ]
    },
    { key: "research", href: "/research" },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white shadow-lg">
      <div className="border-b border-gray-100">
        <Logo />
        <div className="px-4 pb-4">
          <span className="text-sm text-gray-600 font-outfit">{t.tagline}</span>
          {session?.user?.email && (
            <span className="text-sm text-gray-600 mt-2 font-outfit">
              {session.user.email}
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 flex flex-col p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.href}>
            <Link href={item.href} onClick={() => setIsOpen(false)}>
              <span className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-opacity ${
                pathname === item.href 
                  ? 'font-bold text-lg text-black' 
                  : 'hover:bg-gray-100 text-gray-700 font-outfit'
              }`}>
                {t.menuItems[item.key]}
              </span>
            </Link>
            {item.children && item.children.map((child) => (
              <Link key={child.href} href={child.href} onClick={() => setIsOpen(false)}>
                <span className={`flex items-center px-6 py-2 text-sm rounded-md cursor-pointer transition-opacity ${
                  pathname === child.href 
                    ? 'font-bold text-black' 
                    : 'hover:bg-gray-100 text-gray-500 font-outfit'
                }`}>
                  {t.menuItems[child.key]}
                </span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-black rounded-lg hover:bg-gray-100 font-outfit"
        >
          <LogOut className="w-5 h-5 mr-3" />
          {t.signOut}
        </button>
      </div>

      <div className="mt-auto">
        <LanguageToggle />
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