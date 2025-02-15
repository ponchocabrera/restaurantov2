'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import Link from 'next/link';

export default function ResearchPage() {
  return (
    <DashboardLayout>
      <main className="p-8 max-w-6xl mx-auto">

        {/* TOP TEXT (outside the banner) */}
        <section className="mb-10">
          <h1 className="text-2xl sm:text-5xl font-bold font-libre mb-2 sm:mb-4">
            Understand what makes a Menu Successful
          </h1>
          <h2 className="text-2xl font-bold">Research Insights</h2>
          <p className="text-gray-600">
            Get Research based reports to improve your business
          </p>
        </section>

        {/* BANNER SECTION */}
        <section className="relative mb-12 border rounded-md shadow-lg bg-white p-6 md:p-10 flex flex-col md:flex-row items-start">

          {/* LEFT: Banner Content */}
          <div className="w-full md:w-2/3 md:pr-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#212350] mb-3">
              Understand the Restaurant Industry in your Area
            </h2>
            <a
              href="#"
              className="text-blue-600 text-lg font-medium underline block mb-4"
            >
              Your Monthly's Restaurant Pricing and Trend Analysis
            </a>
            <p className="text-gray-700 mb-2">
              Design and Manage your Menu with Ease. Add your Menu, and let the AI do the rest.
            </p>
            <p className="text-gray-700 mb-2">
              Design and Manage your Menu with Ease. Add your Menu, and let the AI do the rest.
            </p>
            <p className="text-gray-700 mb-6">
              Design and Manage your Menu with Ease. Add your Menu, and let the AI do the rest.
            </p>
            <Link legacyBehavior href="/restaurant-insights">
              <a className="px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
                Learn More
              </a>
            </Link>
          </div>

          {/* RIGHT: Circular Icon Illustration */}
          <div className="hidden md:block relative md:w-1/3">
            {/* 
              Positioning trick:
              - Position absolutely within this column 
              - 'right-[-60px]' pushes it outside the card 
              - 'top-1/2' and '-translate-y-1/2' center it vertically
            */}
            <div className="absolute top-1/3 right-[-60px] -translate-y-1/5">
              <div className="relative w-[300px] h-[300px]">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full bg-[#f9f6f6]" />
                {/* Middle ring */}
                <div className="absolute inset-4 rounded-full bg-white" />
                {/* Inner circle */}
                <div className="absolute inset-8 rounded-full bg-[#f5f5f5]" />
                {/* Center dot */}
                <div
                  className="absolute w-6 h-6 bg-[#212350] rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
                {/* Orange dots */}
                <div
                  className="absolute w-4 h-4 bg-orange-400 rounded-full"
                  style={{ top: '20%', left: '25%' }}
                />
                <div
                  className="absolute w-4 h-4 bg-orange-400 rounded-full"
                  style={{ top: '40%', right: '20%' }}
                />
                <div
                  className="absolute w-4 h-4 bg-orange-400 rounded-full"
                  style={{ bottom: '25%', left: '30%' }}
                />
                <div
                  className="absolute w-4 h-4 bg-orange-400 rounded-full"
                  style={{ bottom: '15%', right: '25%' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Example Next Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[#212350] mb-4">Menu Psychology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={`menu-psych-${i}`}
                className="border rounded-lg p-5 shadow bg-white"
              >
                <h4 className="text-xl font-semibold text-gray-800">
                  Placeholder {i + 1}
                </h4>
                <p className="text-gray-600">Short description here.</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </DashboardLayout>
  );
}
