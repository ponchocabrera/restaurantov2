'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function Dashboard() {
  // State to hold restaurant statistics
  const [restaurantStats, setRestaurantStats] = useState({ menusCount: 0, totalItems: 0 });

  // Fetch restaurant stats on mount.  
  // Here we assume the API returns an array of restaurants;
  // we take the first one for display. Adjust this logic if needed.
  useEffect(() => {
    async function fetchRestaurantStats() {
      try {
        // Fetch the list of restaurants
        const res = await fetch('/api/restaurants');
        if (!res.ok) throw new Error('Failed to fetch restaurants');
        const data = await res.json();
        const restaurants = data.restaurants || [];

        if (restaurants.length > 0) {
          // For simplicity, we take the first restaurant
          const restaurant = restaurants[0];

          // Fetch menus for the selected restaurant
          const menusRes = await fetch(`/api/menus?restaurantId=${restaurant.id}`);
          let menus = [];
          if (menusRes.ok) {
            const menusData = await menusRes.json();
            menus = menusData.menus || [];
          }

          // For each menu, fetch its menu items to count them
          const menusWithDetails = await Promise.all(
            menus.map(async (menu) => {
              const itemsRes = await fetch(`/api/menuItems?menuId=${menu.id}`);
              let itemCount = 0;
              if (itemsRes.ok) {
                const itemsData = await itemsRes.json();
                const items = itemsData.items || [];
                itemCount = items.length;
              }
              return { ...menu, itemCount };
            })
          );

          // Calculate total items count across all menus
          const totalItems = menusWithDetails.reduce((sum, menu) => sum + menu.itemCount, 0);
          const menusCount = menusWithDetails.length;
          setRestaurantStats({ menusCount, totalItems });
        }
      } catch (error) {
        console.error('Error fetching restaurant stats:', error);
      }
    }
    fetchRestaurantStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white px-6 py-12">
        
        {/* Title Section */}
        <h1 className="text-5xl font-bold font-libre mb-6 leading-tight text-[#212350]">Transform Your Menu into a Revenue Engine</h1>
        <h2 className="text-2xl outfit-bold mb-4 text-[#212350]">Made Easy with AI</h2>
        <p className="text-lg font-work-sans mb-12 text-gray-700">From Analysis to Optimization, in three simple steps. All done by Artificial Intelligence.</p>

        {/* AI Tools Section */}
        <h2 className="text-2xl font-outfit-bold mb-6 text-[#212350]">AI Tools</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Left Side: Menu Analyzer Card */}
          <Link 
            href="/menu-analyzer"
            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow w-full flex flex-col h-full border border-gray-200"
          >
            <div className="h-56 md:h-60 mb-6 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src="/assets/icons/Other 12.png" 
                alt="Menu Analyzer"
                className="h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <h3 className="text-lg font-bold font-outfit mb-2">Menu Analyzer</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Upload your menu and get instant, AI-powered insights and recommendations to optimize your menu.
            </p>
          </Link>

          {/* Right Side: Two Smaller Cards */}
          <div className="flex flex-col gap-6 h-full">
            
            {/* Menu Enhancer */}
            <Link 
              href="/menu-enhancer"
              className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow flex items-center gap-6 flex-1 border border-gray-200"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src="/assets/icons/Other 20.png" 
                  alt="Menu Enhancer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit mb-1">Menu Enhancer</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Enhance your menu's descriptions and visuals for better customer engagement.
                </p>
              </div>
            </Link>

            {/* Menu Publisher */}
            <Link 
              href="/menu-publisher"
              className="group bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow flex items-center gap-6 flex-1 border border-gray-200"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src="/assets/icons/menu-icon.svg" 
                  alt="Menu Publisher"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit mb-1">Menu Publisher</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Easily publish and share your optimized menu across digital and print formats.
                </p>
              </div>
            </Link>

          </div>

        </div>

        {/* Your Restaurant & Menu Engineering Research */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Your Restaurant Section */}
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-outfit-bold mb-4 text-[#212350]">Your Restaurant</h2>
            <div className="p-8 bg-gradient-to-br from-[#1D2C40] to-[#354861] text-white rounded-2xl flex-grow flex flex-col justify-between shadow-xl">
              
              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                
                {/* Left Side - Number of Menus */}
                <div className="flex flex-col items-start">
                  <p className="text-md font-bold uppercase tracking-wide">Number of Menus</p>
                  <p className="text-5xl font-bold mt-1">{restaurantStats.menusCount}</p>
                </div>

                {/* Right Side - Number of Items & Excellence Score */}
                <div className="flex flex-col space-y-6">
                  <div>
                    <p className="text-md font-bold uppercase tracking-wide">Number of Menu Items</p>
                    <p className="text-5xl font-bold mt-1">{restaurantStats.totalItems}</p>
                  </div>
                  <div>
                    <p className="text-md font-bold uppercase tracking-wide">Menu Excellence Score</p>
                    <p className="text-5xl font-bold mt-1">9<span className="text-2xl">/10</span></p>
                    <p className="text-sm text-gray-300">Find out your potential improvements</p>
                  </div>
                </div>
              </div>

              {/* Button Section */}
              <div className="flex justify-start mt-8">
                <Link href="/my-restaurants">
                  <button className="bg-white text-[#212350] font-bold py-3 px-6 rounded-full shadow-lg hover:bg-gray-300 transition-all">
                    See your Menu Report
                  </button>
                </Link>
              </div>

            </div>
          </div>

          {/* Menu Engineering Research Section */}
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-outfit-bold mb-4 text-[#212350]">Menu Engineering Research</h2>
            <div className="p-6 bg-[#F8F8F8] border-2 border-[#ffffff] rounded-2xl flex-grow flex flex-col justify-between shadow-xl">
              
              {/* Title & Text */}
              <div>
                <p className="text-lg font-bold">The Psychology of Colors Behind Your Menu</p>
                <p className="text-base text-gray-700 mt-2 leading-relaxed">
                  Learn how color choices impact customer behavior and menu engagement.
                </p>
              </div>
              
              {/* CTA Button */}
              <div className="flex justify-start mt-6">
                <Link href="/research">
                  <button className="bg-[#F4AF54] hover:bg-[#D69A3D] text-black font-bold py-3 px-6 rounded-full shadow-lg">
                    See Carte Research
                  </button>
                </Link>
              </div>
              
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
