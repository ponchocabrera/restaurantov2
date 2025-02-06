'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <div className="bg-gradient-to-r from-[#E49B4F] to-[#F4B55A] h-[30vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-full">
        <div className="text-left space-y-4">
          <h1 className="text-5xl font-bold text-[#21263E] font-sans">
            Dynamic Menu Optimization
          </h1>
          <p className="mt-4 text-base text-[#21263E]/90 font-sans">
            Carte.ai is the intelligent menu optimization platform that transforms restaurant menus from static documents into a source of revenue.
          </p>
          <div className="mt-6">
            <a
              href="/menu-generator"
              className="inline-flex items-center px-6 py-2 bg-[#21263E] text-base font-medium rounded-full text-white hover:bg-[#1A1A1A] transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>

        {/* Placeholder for the 3D box/image */}
        <div className="relative h-[400px] w-[400px]">
          <img
            src="/images/landing/placeholder-image.png" // Replace with actual image path
            alt="3D Box Placeholder"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
