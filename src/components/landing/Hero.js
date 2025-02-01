'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <div className="bg-gradient-to-l from-[#e4983b] to-[#f5bf66] h-[30vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
          {/* Text Content */}
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-bold text-[#21263E] font-libre-baskerville">
              Dynamic Menu
              <br />
              Optimization
            </h1>
            <p className="mt-4 text-base text-[#21263E]/90 font-libre-baskerville">
              Carte.ai is the intelligent menu optimization platform that transforms restaurant menus from static documents into a source of revenue
            </p>
            <div className="mt-6">
              <a
                href="/menu-generator"
                className="inline-flex items-center px-6 py-2 border border-[#21263E] text-base font-medium rounded-full text-[#21263E] hover:bg-[#21263E] hover:text-white transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>

          {/* Image Container */}
          <div className="relative h-[400px] w-full">
            <Image
              src="/images/landing/hero-image.png"
              alt="Menu Design Preview"
              fill
              priority
              className="object-contain scale-110"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
