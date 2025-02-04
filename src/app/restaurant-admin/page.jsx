'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // If using Next.js
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// [A] Sidebar component (inline for demo; typically in its own Sidebar.jsx)
function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 font-bold text-lg border-b border-gray-100">
        My Project
      </div>
      <nav className="flex flex-col p-2 space-y-2">
        {/* Adjust paths to match your routes */}
        <Link href="/dashboard">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Dashboard
          </span>
        </Link>
        <Link href="/templates">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Templates
          </span>
        </Link>
        <Link href="/support">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Support
          </span>
        </Link>
        <Link href="/menu-publisher">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Menu Publisher
          </span>
        </Link>
        <Link href="/menu-creator">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Menu Creator
          </span>
        </Link>
        <Link href="/restaurant-admin">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Restaurant Admin
          </span>
        </Link>
      </nav>
    </aside>
  );
}

export default function RestaurantAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.id) {
        console.log('Session available:', session);
        await fetchRestaurants();
      } else {
        console.log('No session yet:', session);
      }
    };
    fetchData();
  }, [session]);

  async function fetchRestaurants() {
    try {
      console.log('Fetching restaurants with session:', {
        sessionExists: !!session,
        userId: session?.user?.id,
        expires: session?.expires
      });
      
      const res = await fetch('/api/restaurants', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Error response:', error);
        throw new Error(error.error || 'Failed to fetch');
      }

      const data = await res.json();
      console.log('Fetched restaurants:', data);
      setRestaurants(data.restaurants || []);
    } catch (err) {
      console.error('Error in fetchRestaurants:', err);
    }
  }

  async function createRestaurant() {
    if (!newName) return alert('Enter a restaurant name!');

    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create restaurant');
      }

      alert('Created new restaurant: ' + data.restaurant.name);
      setNewName('');
      fetchRestaurants();
    } catch (err) {
      console.error('Error creating restaurant:', err);
      alert(err.message || 'Error creating restaurant');
    }
  }

  async function deleteRestaurant(id) {
    const yes = confirm('Are you sure you want to delete this restaurant?');
    if (!yes) return;

    try {
      const res = await fetch(`/api/restaurants/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete restaurant');
      alert('Deleted successfully!');
      // remove from local state
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  // [B] Render with a left sidebar layout
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
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
    </div>
  );
}

