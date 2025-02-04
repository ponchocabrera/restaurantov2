'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function RestaurantAdmin() {
  const { data: session, status } = useSession();
  const [restaurants, setRestaurants] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (session) {
      fetchRestaurants();
    }
  }, [session]);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('/api/restaurants');
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      const data = await res.json();
      setRestaurants(data.restaurants || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const createRestaurant = async () => {
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      if (!res.ok) throw new Error('Failed to create restaurant');
      
      await fetchRestaurants();
      setNewName('');
    } catch (error) {
      console.error('Error creating restaurant:', error);
    }
  };

  const deleteRestaurant = async (id) => {
    try {
      const res = await fetch(`/api/restaurants/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete restaurant');
      
      await fetchRestaurants();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Restaurant Admin</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create a New Restaurant</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New Restaurant Name"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={createRestaurant}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Existing Restaurants</h2>
          <div className="space-y-3">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <span className="text-gray-700">{restaurant.name}</span>
                <button
                  onClick={() => deleteRestaurant(restaurant.id)}
                  className="text-red-600 hover:text-red-700 focus:outline-none"
                >
                  Delete
                </button>
              </div>
            ))}
            {restaurants.length === 0 && (
              <p className="text-gray-500 text-center py-4">No restaurants yet</p>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
