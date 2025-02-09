'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { ChevronUp, ChevronDown } from 'lucide-react';

// Helper to format analysis raw string into structured sections
function formatAnalysis(raw) {
  if (!raw) return [];
  // Split on "###" which starts each section in your analysis
  const sections = raw.split('###').map(s => s.trim()).filter(Boolean);
  return sections.map(section => {
    const lines = section.split('\n').filter(line => line.trim() !== '');
    // Use the first line as the header, removing any trailing colon
    const header = lines[0].replace(':', '').trim();
    const items = [];
    let currentItem = '';

    // Loop through the remaining lines and merge continuation lines
    for (let i = 1; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (trimmedLine.startsWith('-')) {
        // If there's an existing bullet, push it before starting a new one
        if (currentItem) {
          items.push(currentItem);
        }
        currentItem = trimmedLine.replace(/^-+\s*/, '');
      } else {
        // Append a continuation line to the current item
        if (currentItem) {
          currentItem += ' ' + trimmedLine;
        }
      }
    }
    if (currentItem) {
      items.push(currentItem);
    }

    return { header, items };
  });
}

export default function MyRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState([]);
  const [expandedAnalysisIds, setExpandedAnalysisIds] = useState([]);

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

    async function fetchAnalysesData() {
      try {
        const res = await fetch('/api/menuAnalysis');
        if (!res.ok) {
          throw new Error('Failed to fetch menu analyses');
        }
        const data = await res.json();
        if (data.analyses) setAnalyses(data.analyses);
      } catch (error) {
        console.error('Error fetching analyses:', error);
      }
    }

    fetchRestaurantsData();
    fetchAnalysesData();
  }, []);

  const toggleAnalysis = (id) => {
    if (expandedAnalysisIds.includes(id)) {
      setExpandedAnalysisIds(expandedAnalysisIds.filter(item => item !== id));
    } else {
      setExpandedAnalysisIds([...expandedAnalysisIds, id]);
    }
  };

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
                <h2 className="text-2xl font-semibold font-outfit text-gray-800">
                  {restaurant.name}
                </h2>
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
        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Saved Menu Analyses</h2>
          {analyses.length === 0 ? (
            <p>No menu analyses available yet.</p>
          ) : (
            analyses.map((record) => (
              <div key={record.id} className="border rounded p-4 mb-4 bg-white shadow">
                <div
                  className="flex justify-between items-center mb-2 text-sm text-gray-600 cursor-pointer"
                  onClick={() => toggleAnalysis(record.id)}
                >
                  <span>Analysis ID: {record.id}</span>
                  <span>{new Date(record.created_at).toLocaleString()}</span>
                  {expandedAnalysisIds.includes(record.id) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
                {expandedAnalysisIds.includes(record.id) && (
                  <>
                    {record.analysis && record.analysis.raw ? (
                      formatAnalysis(record.analysis.raw).map((section, idx) => (
                        <div key={idx} className="mb-4">
                          <h3 className="font-bold text-lg">{section.header}</h3>
                          <ul className="list-disc pl-6">
                            {section.items.map((item, jdx) => (
                              <li key={jdx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <pre className="bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(record.analysis, null, 2)}
                      </pre>
                    )}
                    {record.recommendations && typeof record.recommendations === 'object' && (
                      <div className="mt-4">
                        <h3 className="font-bold text-lg">Menu Recommendations</h3>
                        {Object.keys(record.recommendations).map((section) => (
                          <div key={section} className="mb-4">
                            <h4 className="font-semibold text-lg capitalize">
                              {section.replace(/([A-Z])/g, ' $1')}
                            </h4>
                            {record.recommendations[section].length > 0 ? (
                              record.recommendations[section].map((rec, idx) => (
                                <div key={idx} className="border rounded p-3 my-2 bg-gray-50">
                                  <p><strong>Recommendation:</strong> {rec.recommendation}</p>
                                  <p><strong>Reasoning:</strong> {rec.reasoning}</p>
                                  <p><strong>Expected Impact:</strong> {rec.impact}</p>
                                  <p><strong>Priority:</strong> {rec.priority}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500">No recommendations available for {section}.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {record.image_data && (
                      <div className="mt-4">
                        <img
                          src={record.image_data}
                          alt="Menu preview"
                          className="w-full max-h-64 object-cover rounded"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}