'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-6">
        
        {/* Title Section */}
        <h1 className="text-5xl font-bold font-libre mb-2">Transform your menu into a Revenue Engine</h1>
        <h2 className="text-3xl outfit-bold mb-4">Made Easy with AI</h2>
        <p className="text-base font-work-sans mb-8">From Analysis to Optimization, in three simple steps. All done by Artificial Intelligence.</p>

        {/* AI Tools Section - Adjusted Layout with Stronger Shadows */}
        <h2 className="text-2xl font-outfit-bold mb-4">AI Tools</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* Left Side: Menu Analyzer Card with Stronger Shadow */}
          <Link 
            href="/menu-analyzer"
            className="group bg-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-shadow w-full flex flex-col h-full"
          >
            <div className="h-56 md:h-60 mb-4 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src="/assets/icons/Other 12.png" 
                alt="Menu Analyzer"
                className="h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <h3 className="text-lg font-bold font-outfit mb-2">Menu Analyzer</h3>
            <p className="text-gray-600 text-sm">
              Orci semper leo viverra commodo nunc eu. Adipiscing a non dignissim purus. 
              Nec morbi fermentum convallis augue. Vitae.
            </p>
          </Link>

          {/* Right Side: Two Smaller Cards with Stronger Shadows */}
          <div className="flex flex-col gap-4 h-full">
            
            {/* Menu Enhancer */}
            <Link 
              href="/menu-enhancer"
              className="group bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-4 flex-1"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src="/assets/icons/Other 20.png" 
                  alt="Menu Enhancer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit mb-1">Menu Enhancer</h3>
                <p className="text-gray-600 text-sm">
                  Orci semper leo viverra commodo nunc eu. Adipiscing a non dignissim purus. 
                  Nec morbi fermentum convallis augue. Vitae.
                </p>
              </div>
            </Link>

            {/* Menu Publisher */}
            <Link 
              href="/menu-publisher"
              className="group bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-4 flex-1"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src="/assets/icons/menu-icon.svg" 
                  alt="Menu Publisher"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit mb-1">Menu Publisher</h3>
                <p className="text-gray-600 text-sm">
                  Orci semper leo viverra commodo nunc eu. Adipiscing a non dignissim purus. 
                  Nec morbi fermentum convallis augue. Vitae.
                </p>
              </div>
            </Link>

          </div>

        </div>

        {/* Your Restaurant & Menu Engineering Research - Keeping Two Column Layout */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Your Restaurant Section */}
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-outfit-bold mb-2">Your Restaurant</h2>
            <div className="p-6 bg-[#212350] text-white rounded-2xl flex-grow flex flex-col justify-between shadow-lg">
              
              {/* Stats Section */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-5xl font-bold">3</p>
                  <p className="text-sm">Number of Menus</p>
                </div>
                <div>
                  <p className="text-5xl font-bold">48</p>
                  <p className="text-sm">Number of Menu Items</p>
                </div>
                <div className="col-span-2">
                  <p className="text-5xl font-bold">9<span className="text-lg">/10</span></p>
                  <p className="text-sm font-bold">Menu Excellence Score</p>
                  <p className="text-xs text-gray-300">Find out your potential improvements</p>
                </div>
              </div>

              {/* Button Section */}
              <div className="flex justify-center md:justify-start mt-6">
                <button className="bg-white text-[#212350] font-bold py-4 px-6 rounded-full shadow-lg hover:bg-gray-300 transition-all w-48 text-center">
                  See your Menu Report
                </button>
              </div>

            </div>
          </div>

          {/* Menu Engineering Research Section */}
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-outfit-bold mb-2">Menu Engineering Research</h2>
            <div className="p-6 bg-[#F8F8F8] border-2 border-[#ffffff] rounded-2xl flex-grow flex flex-col justify-between shadow-lg">
              
              {/* Title & Text */}
              <div>
                <p className="text-lg font-bold">The Psychology of colors behind your Menu</p>
                <p className="text-sm text-gray-700 mt-2">
                  Orci semper leo viverra commodo nunc eu. Adipiscing a non dignissim purus. 
                  Nec morbi fermentum convallis augue. Vitae.
                </p>
              </div>

              {/* CTA Button */}
              <div className="flex justify-center md:justify-start mt-6">
                <button className="bg-[#F4AF54] hover:bg-[#D69A3D] text-black font-bold py-2 px-4 rounded shadow-lg">
                  See Carte Research
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
