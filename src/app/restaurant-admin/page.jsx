'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // If using Next.js

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
  const [restaurants, setRestaurants] = useState([]);
  const [newName, setNewName] = useState('');

  // On mount, load all restaurants
  useEffect(() => {
    fetchRestaurants();
  }, []);

  async function fetchRestaurants() {
    try {
      const res = await fetch('/api/restaurants');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRestaurants(data.restaurants || []);
    } catch (err) {
      console.error(err);
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
      if (!res.ok) throw new Error('Failed to create restaurant');
      const data = await res.json();
      alert('Created new restaurant: ' + data.restaurant.name);
      setNewName('');
      // reload the list
      fetchRestaurants();
    } catch (err) {
      console.error(err);
      alert('Error creating restaurant');
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

  // [B] Render with a left sidebar layout
  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Left sidebar */}
      <Sidebar />

      {/* Right content area */}
      <div className="flex flex-col flex-grow">
        {/* Optional header */}
        <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <h1 className="text-xl font-bold">Restaurant Admin</h1>
        </header>

        {/* Main content */}
        <main className="p-4 md:p-6 max-w-lg mx-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Create a New Restaurant
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="border p-2 rounded flex-grow"
                placeholder="New Restaurant Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button
                onClick={createRestaurant}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Create
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">
              Existing Restaurants
            </h2>
            <ul className="space-y-2">
              {restaurants.map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between items-center bg-white p-2 rounded shadow"
                >
                  <div>{r.name}</div>
                  <button
                    onClick={() => deleteRestaurant(r.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}

