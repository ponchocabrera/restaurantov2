'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// [1] Inline Sidebar (for demo)
function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 font-bold text-lg border-b border-gray-100">
        My Project
      </div>
      <nav className="flex flex-col p-2 space-y-2">
        <Link href="/dashboard">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Dashboard
          </span>
        </Link>
        <Link href="/menu-creator">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Menu Creator
          </span>
        </Link>
        <Link href="/menu-publisher">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Menu Publisher
          </span>
        </Link>
        <Link href="/restaurant-admin">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Restaurant Admin
          </span>
        </Link>
        <Link href="/restaurant-profile/1">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Restaurant Profile
          </span>
        </Link>
      </nav>
    </aside>
  );
}

// Example choice arrays for your existing fields
const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'American',
  'Mediterranean', 'Thai', 'French', 'Korean', 'Fusion', 'Seafood',
  'Steakhouse', 'Vegan', 'BBQ',
];

const DEMO_OPTIONS = [
  'Families', 'Young Professionals', 'Students', 'Tourists',
  'Business Lunch', 'Senior Citizens', 'Health Conscious',
];

const PRICE_RANGE_OPTIONS = ['$','$$','$$$','$$$$'];

const SERVICE_TYPES = [
  'Dine-in', 'Takeout', 'Delivery', 'Catering',
  'Food Truck', 'Ghost Kitchen', 'Private Events',
];

export default function RestaurantProfilePage() {
  // ------------------- Existing Form States (no AI or color palette) -------------------
  const [restaurantName, setRestaurantName] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedDemographics, setSelectedDemographics] = useState([]);
  const [averageTicketSize, setAverageTicketSize] = useState('');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
  const [weekdayStart, setWeekdayStart] = useState('12:30');
  const [weekdayEnd, setWeekdayEnd] = useState('12:30');
  const [weekendStart, setWeekendStart] = useState('12:30');
  const [weekendEnd, setWeekendEnd] = useState('12:30');

  // Toggle chips (e.g. cuisines, demographics, service types)
  function toggleSelection(option, selectedArray, setSelectedFn) {
    if (selectedArray.includes(option)) {
      setSelectedFn(selectedArray.filter((item) => item !== option));
    } else {
      setSelectedFn([...selectedArray, option]);
    }
  }

  // Single-select price range
  function handlePriceSelect(range) {
    setSelectedPriceRange(range);
  }

  // Save handler (no color palette in this version)
  async function handleSave() {
    const payload = {
      restaurantName,
      selectedCuisines,
      priceRange: selectedPriceRange,
      demographics: selectedDemographics,
      averageTicketSize,
      serviceTypes: selectedServiceTypes,
      operatingHours: {
        weekday: { start: weekdayStart, end: weekdayEnd },
        weekend: { start: weekendStart, end: weekendEnd },
      },
    };
    console.log('Saving data:', payload);

    // Example fetch to /api/restaurants (adjust if needed)
    const response = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      alert('Error saving restaurant info');
      return;
    }
    alert('Profile saved successfully!');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-grow p-6 space-y-8">
        <h1 className="text-3xl font-extrabold mb-2">Restaurant Profile</h1>
        <p className="text-gray-600 mb-6">
          Complete your profile to receive personalized menu suggestions
        </p>

        {/* BASIC INFO */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Restaurant Name</span>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="mt-1 block w-full p-2 border rounded"
              placeholder="Enter your restaurant name"
            />
          </label>

          {/* Cuisine Types */}
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Cuisine Types
            </span>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((cuisine) => {
                const isSelected = selectedCuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() =>
                      toggleSelection(cuisine, selectedCuisines, setSelectedCuisines)
                    }
                    className={`px-3 py-1 rounded-full border text-sm 
                      ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-700 border-gray-300 bg-white'
                      }
                    `}
                  >
                    {cuisine}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TARGET MARKET */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Target Market</h2>

          {/* Price Range */}
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Price Range
            </span>
            <div className="flex space-x-2">
              {PRICE_RANGE_OPTIONS.map((range) => (
                <button
                  key={range}
                  type="button"
                  className={`px-3 py-1 rounded-full border text-sm
                    ${
                      selectedPriceRange === range
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-gray-700 border-gray-300 bg-white'
                    }
                  `}
                  onClick={() => handlePriceSelect(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Demographics */}
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Primary Demographics
            </span>
            <div className="flex flex-wrap gap-2">
              {DEMO_OPTIONS.map((demo) => {
                const isSelected = selectedDemographics.includes(demo);
                return (
                  <button
                    key={demo}
                    type="button"
                    onClick={() =>
                      toggleSelection(demo, selectedDemographics, setSelectedDemographics)
                    }
                    className={`px-3 py-1 rounded-full border text-sm 
                      ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-700 border-gray-300 bg-white'
                      }
                    `}
                  >
                    {demo}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Average Ticket Size */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Average Ticket Size</span>
            <div className="relative mt-1">
              <span className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={averageTicketSize}
                onChange={(e) => setAverageTicketSize(e.target.value)}
                className="pl-8 pr-2 py-2 border rounded w-full"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </label>
        </div>

        {/* SERVICE DETAILS */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Service Details</h2>

          {/* Service Types */}
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Service Types
            </span>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map((service) => {
                const isSelected = selectedServiceTypes.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() =>
                      toggleSelection(service, selectedServiceTypes, setSelectedServiceTypes)
                    }
                    className={`px-3 py-1 rounded-full border text-sm
                      ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-700 border-gray-300 bg-white'
                      }
                    `}
                  >
                    {service}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1">Weekday Hours</label>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={weekdayStart}
                  onChange={(e) => setWeekdayStart(e.target.value)}
                  className="border rounded p-1"
                />
                <span className="text-gray-600">to</span>
                <input
                  type="time"
                  value={weekdayEnd}
                  onChange={(e) => setWeekdayEnd(e.target.value)}
                  className="border rounded p-1"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Weekend Hours</label>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={weekendStart}
                  onChange={(e) => setWeekendStart(e.target.value)}
                  className="border rounded p-1"
                />
                <span className="text-gray-600">to</span>
                <input
                  type="time"
                  value={weekendEnd}
                  onChange={(e) => setWeekendEnd(e.target.value)}
                  className="border rounded p-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="text-right">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
