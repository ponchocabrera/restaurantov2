// [1] File: components/Sidebar.jsx
import React from 'react';
import Link from 'next/link';

export default function Sidebar() {
  return (
    // [2] A vertical sidebar with a width of 64 (tailwind class "w-64")
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* [3] Sidebar heading or brand name */}
      <div className="p-4 font-bold text-lg border-b border-gray-100">
        My Project
      </div>

      {/* [4] Navigation links */}
      <nav className="flex flex-col p-2 space-y-2">
        {/* Example route: Menu Creator */}
        <Link href="/menu_creator">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Dashboard
          </span>
        </Link>

        {/* Example route: Templates */}
        <Link href="/restaurant-admin">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Templates
          </span>
        </Link>

        {/* Example route: Support */}
        <Link href="/support">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Support
          </span>
        </Link>

        {/* Example route: Menu Publisher */}
        <Link href="/menu-publisher">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Menu Publisher
          </span>
        </Link>

        {/* [5] Add any other routes you want here... */}
      </nav>
    </aside>
  );
}
