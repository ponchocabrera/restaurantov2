'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { ChevronUp, ChevronDown } from 'lucide-react';
import RawMaterialModal from '@/components/RawMaterialModal';
import Link from 'next/link';
import ActionableSuggestion from '@/components/ActionableSuggestion';
import MasterRecommendation from "@/components/MasterRecommendation";

// Optional formatting helper if needed
function formatAnalysis(raw) {
  if (!raw) return [];
  const sections = raw.split('###').map(s => s.trim()).filter(Boolean);
  return sections.map(section => {
    const lines = section.split('\n').filter(line => line.trim() !== '');
    const header = lines[0].replace(':', '').trim();
    const items = [];
    let currentItem = '';
    for (let i = 1; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (trimmedLine.startsWith('-')) {
        if (currentItem) {
          items.push(currentItem);
        }
        currentItem = trimmedLine.replace(/^-+\s*/, '');
      } else {
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

// Render a nicely formatted analysis details view.
function renderAnalysisDetails(analysis) {
  if (!analysis || typeof analysis !== 'object') return null;
  
  const sectionConfig = [
    { key: 'structure', title: 'Structure' },
    { key: 'design', title: 'Design' },
    { key: 'pricing', title: 'Pricing' },
    { key: 'color', title: 'Color' },
    { key: 'visualElements', title: 'Visual Elements' },
    { key: 'psychology', title: 'Customer Psychology' },
    { key: 'engineering', title: 'Menu Engineering' },
    { key: 'customerExperience', title: 'Customer Experience' }
  ];

  const processedSections = new Set();
  
  const processSectionItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
      const key = typeof item === 'string' ? 
        item.toLowerCase().trim() : 
        JSON.stringify(item).toLowerCase();
      if (processedSections.has(key)) return false;
      processedSections.add(key);
      return true;
    });
  };

  return (
    <div className="mt-4">
      {sectionConfig.map(({ key, title }) => {
        const items = processSectionItems(analysis[key]);
        if (!items || items.length === 0) return null;
        
        return (
          <div key={key} className="mb-3">
            <h4 className="font-bold">{title}</h4>
            <ul className="list-disc ml-5">
              {items.map((item, index) => (
                <li key={index} className="text-sm text-gray-700">{item}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// Render recommendations details with custom RecommendationItem for each entry.
function renderRecommendations(recommendations) {
  if (!recommendations || typeof recommendations !== 'object') return null;
  
  const sectionConfig = [
    { key: 'psychology', title: 'Menu Psychology & Colors' },
    { key: 'design', title: 'Layout & Design' },
    { key: 'engineering', title: 'Menu Engineering' },
    { key: 'pricing', title: 'Pricing Strategy' },
    { key: 'visualHierarchy', title: 'Visual Hierarchy' },
    { key: 'customerExperience', title: 'Customer Experience' }
  ];

  return (
    <div className="space-y-8">
      <Link 
        href={`/special-recommendations?id=${recommendations.id}`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        View Special Dish & Market Recommendations →
      </Link>

      {sectionConfig.map(({ key, title }) => {
        const recs = recommendations[key];
        if (!Array.isArray(recs) || recs.length === 0) return null;

        return (
          <div key={key} className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
            <ul className="space-y-2">
              {recs.map((rec, index) => (
                <li key={index} className="text-sm">
                  {typeof rec === 'object' ? (
                    <div>
                      <p className="font-medium">{rec.recommendation}</p>
                      {rec.reasoning && <p className="text-gray-600 mt-1">Why: {rec.reasoning}</p>}
                      {rec.impact && <p className="text-gray-600">Impact: {rec.impact}</p>}
                      {rec.priority && (
                        <p className={`text-${rec.priority.toLowerCase() === 'high' ? 'red' : 'gray'}-600`}>
                          Priority: {rec.priority}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p>{rec}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function MyRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState([]);
  const [expandedAnalysisIds, setExpandedAnalysisIds] = useState([]);
  const [rawModalData, setRawModalData] = useState(null);
  const [latestSearch, setLatestSearch] = useState(null);
  const [fullPrompt, setFullPrompt] = useState("");
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [showAllAnalyses, setShowAllAnalyses] = useState(false); // Toggle for showing all analyses

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
        if (!res.ok) throw new Error('Failed to fetch analyses');
        const data = await res.json();
        setAnalyses(data.analyses || []);
      } catch (error) {
        console.error('Error fetching analyses data:', error);
      }
    }
    
    async function fetchLatestSearch() {
      try {
        const res = await fetch('/api/restaurant-searches');
        if (res.ok) {
          const data = await res.json();
          const searches = data.searches || [];
          if (searches.length > 0) {
            const sortedSearches = searches.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
            setLatestSearch(sortedSearches[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching latest restaurant search:', error);
      }
    }

    fetchRestaurantsData();
    fetchAnalysesData();
    fetchLatestSearch();
  }, []);

  const toggleAnalysis = (id) => {
    setExpandedAnalysisIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleShowRaw = (raw) => {
    setRawModalData(raw);
  };

  const handleCloseModal = () => {
    setRawModalData(null);
  };

  async function handleGenerateFullPrompt() {
    if (!latestSearch) {
      console.error('Missing latest search data');
      return;
    }
    setLoadingPrompt(true);
    try {
      const response = await fetch('/api/ai/generateAIPrompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: latestSearch
        })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch full prompt');
      }
      const data = await response.json();
      setFullPrompt(data.prompt);
    } catch (error) {
      console.error('Error generating full prompt:', error);
    } finally {
      setLoadingPrompt(false);
    }
  }

  // Sort analyses by created date (descending) and decide which ones to show.
  const sortedAnalyses = analyses
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const visibleAnalyses = showAllAnalyses ? sortedAnalyses : sortedAnalyses.slice(0, 3);

  return (
    <DashboardLayout>
      <main className="p-4 max-w-4xl mx-auto space-y-12">
        <header className="space-y-4">
          <h1 className="text-5xl font-bold font-libre leading-tight text-[#212350]">
            Your Restaurant
          </h1>
          <h2 className="text-2xl outfit-bold text-[#212350]">
            See your Restaurant's activity
          </h2>
          <p className="text-lg text-gray-600">
            Action on your Menu Reviews, and get insights on your Restaurant's activity.
          </p>
        </header>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Actionable Suggestion styled like snippet */}
          
              {latestSearch && <ActionableSuggestion latestSearch={latestSearch} />}
          

          {/* Right Column: Restaurants List styled like snippet */}
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-outfit-bold mb-4 text-[#212350]">Restaurants</h2>
            <div className="p-8 bg-gradient-to-br from-[#1D2C40] to-[#354861] text-white rounded-2xl flex-grow flex flex-col justify-between shadow-xl">
              {loading ? (
                <div className="text-center text-gray-300">Loading...</div>
              ) : (
                <div className="space-y-6">
                  {restaurants.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      
                      onClick={() =>
                        setExpandedRestaurantId(
                          expandedRestaurantId === restaurant.id ? null : restaurant.id
                        )
                      }
                    >
                      <h2 className="text-2xl font-semibold font-outfit text-white">
                        {restaurant.name}
                      </h2>
                      <p className="text-white">Number of Menus: {restaurant.menusCount}</p>
                      <p className="text-white">Total Items: {restaurant.totalItems}</p>
                      {expandedRestaurantId === restaurant.id && (
                        <div className="mt-4 ml-4 border-t pt-4 text-white">
                          <h3 className="text-xl font-bold mb-3">Menus</h3>
                          {restaurant.menus.length > 0 ? (
                            restaurant.menus.map((menu) => (
                              <div key={menu.id} className="p-3 border-b">
                                <p className="text-lg font-medium">{menu.name}</p>
                                <p>Items: {menu.itemCount}</p>
                                <p>Average Plate Price: ${menu.averagePrice}</p>
                              </div>
                            ))
                          ) : (
                            <p>No menus available</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Master Recommendation */}
        {latestSearch ? (
          <MasterRecommendation restaurantName={latestSearch.restaurant_name} />
        ) : (
          <p>No restaurant search found. Please conduct a restaurant search first.</p>
        )}

        {/* Banner Section */}
        <div className="bg-blue-100 p-6 rounded-lg flex flex-col items-start text-left">
          <h2 className="text-3xl font-bold mb-2">Learn about your Restaurant</h2>
          <h3 className="text-xl font-semibold mb-2">
            Your Restaurant, its Area and New Food Trends
          </h3>
          <p className="text-gray-700 mb-4">
            Understand the food business industry around your Area, find trends and learn how to grow your business.
          </p>
          <Link href="/restaurant-insights">
            <button className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-500 transition-colors">
              Get Insights
            </button>
          </Link>
        </div>

        {/* Saved Menu Analyses Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Saved Menu Analyses</h2>
          {sortedAnalyses.length === 0 ? (
            <p>No menu analyses available yet.</p>
          ) : (
            <>
              {visibleAnalyses.map((record) => {
                const analysis = record.analysis;
                let analyzedPointsCount = 0;
                if (analysis && typeof analysis === 'object') {
                  analyzedPointsCount =
                    (analysis.structure?.length || 0) +
                    (analysis.design?.length || 0) +
                    (analysis.pricing?.length || 0) +
                    (analysis.color?.length || 0) +
                    (analysis.visualElements?.length || 0) +
                    (analysis.psychology?.length || 0) +
                    (analysis.engineering?.length || 0) +
                    (analysis.customerExperience?.length || 0);
                }
                
                let recommendationsCount = 0;
                if (
                  record.recommendations &&
                  typeof record.recommendations === 'object' &&
                  !Array.isArray(record.recommendations)
                ) {
                  recommendationsCount = Object.values(record.recommendations).reduce(
                    (acc, curr) => {
                      if (Array.isArray(curr)) return acc + curr.length;
                      else if (typeof curr === 'string')
                        return acc + curr.split('\n').filter((line) => line.trim() !== '').length;
                      return acc;
                    },
                    0
                  );
                }

                return (
                  <div key={record.id} className="border rounded p-4 mb-4 bg-white shadow">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleAnalysis(record.id)}
                    >
                      {/* Left side: Image & Analysis Info */}
                      <div className="flex items-center space-x-4">
                        {record.image_data && (
                          <img
                            src={record.image_data}
                            alt="Analyzed Menu"
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm">Analysis ID: {record.id}</div>
                          <div className="text-gray-500 text-xs">
                            {new Date(record.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Counts for Analyzed Points & Recommendations */}
                      <div className="flex items-center space-x-8">
                        <div className="text-center">
                          <div className="font-bold text-sm">{analyzedPointsCount}</div>
                          <div className="text-gray-500 text-xs">Analyzed Points</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-sm">{recommendationsCount}</div>
                          <div className="text-gray-500 text-xs">Recommendations</div>
                        </div>
                      </div>

                      {/* Right side: Expand / Collapse icon */}
                      <div>
                        {expandedAnalysisIds.includes(record.id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details view */}
                    {expandedAnalysisIds.includes(record.id) && (
                      <div className="mt-4">
                        <div className="mb-4">
                          <h3 className="font-medium">Analysis Details:</h3>
                          {analysis ? (
                            renderAnalysisDetails(analysis)
                          ) : (
                            <p>No analysis available.</p>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">Recommendations:</h3>
                          {record.recommendations
                            ? renderRecommendations(record.recommendations)
                            : <p>No recommendations available.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {sortedAnalyses.length > 3 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllAnalyses(prev => !prev)}
                    className="text-blue-600 hover:underline"
                  >
                    {showAllAnalyses ? "Show less" : "See all your analysis"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}
