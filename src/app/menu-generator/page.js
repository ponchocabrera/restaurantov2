'use client';

import React from 'react';
import Link from 'next/link';
import AIMenuGenerator from '../../components/AIMenuGenerator';
import Sidebar from '../../components/Sidebar';

export default function MenuGeneratorPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800">
              Graphic Menu Generator
            </h1>
            <nav className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link 
                href="/templates" 
                className="text-gray-600 hover:text-gray-900"
              >
                Templates
              </Link>
              <Link 
                href="/support" 
                className="text-gray-600 hover:text-gray-900"
              >
                Support
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <nav className="mb-6">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <Link href="/dashboard" className="hover:text-gray-700">
                    Dashboard
                  </Link>
                </li>
                <li>•</li>
                <li className="text-gray-900">Menu Generator</li>
              </ol>
            </nav>

            {/* Quick Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-blue-800 font-medium mb-2">
                AI-Powered Menu Design
              </h2>
              <p className="text-blue-600 text-sm">
                Our AI system analyzes your menu data, applies research-backed 
                design principles, and generates a professional menu layout optimized 
                for your business.
              </p>
            </div>

            {/* Menu Generator Component */}
            <AIMenuGenerator />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} RestaurantOS. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}