'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function MyRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurantsData() {
      try {
        const res = await fetch('/api/restaurants');
        if (!res.ok) throw new Error('Failed to fetch restaurants');
        const data = await res.json();
        const fetchedRestaurants = data.restaurants || [];

        const restaurantsWithStats = await Promise.all(
          fetchedRestaurants.map(async (restaurant) => {
            const menusRes = await fetch(`/api/menus?restaurantId=${restaurant.id}`);
            let menus = [];
            if (menusRes.ok) {
              const menusData = await menusRes.json();
              menus = menusData.menus || [];
            }

            const menusWithDetails = await Promise.all(
              menus.map(async (menu) => {
                const itemsRes = await fetch(`/api/menuItems?menuId=${menu.id}`);
                let itemCount = 0;
                let averagePrice = 0;
                if (itemsRes.ok) {
                  const itemsData = await itemsRes.json();
                  const items = itemsData.items || [];
                  itemCount = items.length;
                  if (itemCount > 0) {
                    const sumPrices = items.reduce(
                      (sum, item) => sum + parseFloat(item.price || 0),
                      0
                    );
                    averagePrice = sumPrices / itemCount;
                    averagePrice = Number(averagePrice.toFixed(2));
                  }
                }
                return { ...menu, itemCount, averagePrice };
              })
            );

            const totalItems = menusWithDetails.reduce((sum, menu) => sum + menu.itemCount, 0);
            return {
              ...restaurant,
              menus: menusWithDetails,
              menusCount: menusWithDetails.length,
              totalItems,
            };
          })
        );

        setRestaurants(restaurantsWithStats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
        setLoading(false);
      }
    }
    fetchRestaurantsData();
  }, []);

  return (
    <DashboardLayout>
      <main className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold font-outfit mb-4">Your Restaurant</h1>
        <p className="text-lg text-gray-600 mb-6">
          Upload your menu and get AI-powered insights and recommendations for your menu.
        </p>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-6">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="border rounded-lg p-5 shadow-lg cursor-pointer bg-white"
                onClick={() =>
                  setExpandedRestaurantId(
                    expandedRestaurantId === restaurant.id ? null : restaurant.id
                  )
                }
              >
                <h2 className="text-2xl font-semibold font-outfit text-gray-800">{restaurant.name}</h2>
                <p className="text-gray-600">Number of Menus: {restaurant.menusCount}</p>
                <p className="text-gray-600">Total Items: {restaurant.totalItems}</p>
                {expandedRestaurantId === restaurant.id && (
                  <div className="mt-4 ml-4 border-t pt-4">
                    <h3 className="text-xl font-bold mb-3 text-gray-700">Menus</h3>
                    {restaurant.menus.length > 0 ? (
                      restaurant.menus.map((menu) => (
                        <div key={menu.id} className="p-3 border-b">
                          <p className="text-lg font-medium text-gray-800">{menu.name}</p>
                          <p className="text-gray-600">Items: {menu.itemCount}</p>
                          <p className="text-gray-600">Average Plate Price: ${menu.averagePrice}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No menus available</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
