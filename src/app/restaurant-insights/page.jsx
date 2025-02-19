'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import Sidebar from '@/components/shared/Sidebar';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function RestaurantInsightsPage() {
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);           // Holds the CURRENT (fresh) search result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchTrends, setSearchTrends] = useState([]);  // All past searches from DB
  const [selectedRestaurant, setSelectedRestaurant] = useState(''); // Which restaurant is selected in the dropdown

  const autoCompleteRef = useRef(null);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [circle, setCircle] = useState(null);
  const [filterOption, setFilterOption] = useState('bestRated');

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

  // Initialize Google autocomplete
  const handleScriptLoad = () => {
    if (window.google && autoCompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(autoCompleteRef.current, {
        types: ['address'],
      });
      autocomplete.setFields(['formatted_address']);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setAddress(place.formatted_address);
        }
      });
    }
  };

  // Fetch all past searches on mount
  async function fetchSearchTrends() {
    try {
      const res = await fetch('/api/restaurant-searches');
      if (res.ok) {
        const data = await res.json();
        setSearchTrends(data.searches || []);
      }
    } catch (error) {
      console.error('Error fetching search trends:', error);
    }
  }

  useEffect(() => {
    fetchSearchTrends();
  }, []);

  // Handle searching for a new restaurant
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/restaurant-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch restaurant insights');
      }

      const result = await res.json();
      setData(result.data);
      // Re-fetch updated list of searches so we see the newly saved one (if your API saves it)
      fetchSearchTrends();
    } catch (err) {
      if (err.message.includes('Restaurant not found')) {
        setError("We couldn't find a restaurant with the provided address. Please double-check and try again.");
      } else if (err.message.includes('Address is required')) {
        setError('Please provide an address before searching.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Create an advanced marker
  const createAdvancedMarker = ({ position, map, title, iconUrl }) => {
    const markerDiv = document.createElement('div');
    markerDiv.style.display = 'flex';
    markerDiv.style.alignItems = 'center';
    markerDiv.style.justifyContent = 'center';

    const img = document.createElement('img');
    img.src = iconUrl;
    img.alt = title;
    img.style.width = '32px';
    img.style.height = '32px';
    markerDiv.appendChild(img);

    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      title,
      content: markerDiv,
    });
    return marker;
  };

  // Update map whenever "data" changes
  useEffect(() => {
    if (data && window.google && mapRef.current) {
      // Clear old markers/circle
      markers.forEach((marker) => {
        if (marker.setMap) marker.setMap(null);
      });
      if (circle) circle.setMap(null);

      const { restaurantInfo, nearbyRestaurants } = data;
      if (!restaurantInfo?.geometry?.location) return;

      const { lat, lng } = restaurantInfo.geometry.location;
      const center = new window.google.maps.LatLng(lat, lng);

      let map = mapInstance;
      if (!map) {
        map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          mapId,
        });
        setMapInstance(map);
      } else {
        map.setCenter(center);
      }

      const newMarkers = [];
      // Main marker
      const mainMarker = createAdvancedMarker({
        position: center,
        map,
        title: restaurantInfo.name,
        iconUrl: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      });
      newMarkers.push(mainMarker);

      // Nearby restaurants
      if (Array.isArray(nearbyRestaurants)) {
        nearbyRestaurants.forEach((rest) => {
          const lat = rest?.geometry?.location?.lat;
          const lng = rest?.geometry?.location?.lng;
          if (typeof lat === 'number' && typeof lng === 'number') {
            const pos = new window.google.maps.LatLng(lat, lng);
            const marker = createAdvancedMarker({
              position: pos,
              map,
              title: rest.name,
              iconUrl: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            });
            newMarkers.push(marker);
          }
        });
      }

      // Circle
      const newCircle = new window.google.maps.Circle({
        strokeColor: '#0000FF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#0000FF',
        fillOpacity: 0.15,
        map,
        center,
        radius: 5000,
      });

      setMarkers(newMarkers);
      setCircle(newCircle);
    }
  }, [data]);

  // STAR RATING HELPER
  const renderStars = (rating) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="text-yellow-500">★</span>);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">★</span>);
    }
    return stars;
  };

  // Comparison helpers
  const compareRating = (targetRating, mainRating) => {
    const diff = targetRating - mainRating;
    if (diff > 0) return `${diff.toFixed(1)} star(s) higher`;
    else if (diff < 0) return `${Math.abs(diff).toFixed(1)} star(s) lower`;
    return 'Same rating';
  };

  const comparePrice = (targetPrice, mainPrice) => {
    const diff = (targetPrice || 0) - (mainPrice || 0);
    if (diff > 0) return `${diff} level(s) more expensive`;
    else if (diff < 0) return `${Math.abs(diff)} level(s) cheaper`;
    return 'Same price level';
  };

  // All unique restaurant names from past searches
  const uniqueRestaurantNames = Array.from(new Set(searchTrends.map(s => s.restaurant_name)));

  // Decide which restaurant to show in the chart:
  //   - If user selected one in the dropdown, use that
  //   - Else if we have any searches, use the first
  //   - Otherwise, none
  let displayRestaurant = selectedRestaurant;
  if (!displayRestaurant && uniqueRestaurantNames.length > 0) {
    displayRestaurant = uniqueRestaurantNames[0];
  }

  // Filter the entire searchTrends array for the chosen restaurant
  const filteredTrendData = searchTrends.filter(s => s.restaurant_name === displayRestaurant);

  // The "lastSearch" is the most recent data for that restaurant
  let lastSearch = null;
  if (filteredTrendData.length > 0) {
    const sortedTrends = [...filteredTrendData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    lastSearch = sortedTrends[0];
  }

  // CHART COMPONENT
  function SearchTrendsChart({ dataPoints }) {
    if (!dataPoints || dataPoints.length === 0) {
      return <p className="text-gray-500">No search history yet.</p>;
    }
    const labels = dataPoints.map(dp => new Date(dp.created_at).toLocaleDateString());
    const starRatings = dataPoints.map(dp => dp.star_rating);
    const positions = dataPoints.map(dp => dp.position);

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Star Rating',
          data: starRatings,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y',
        },
        {
          label: 'Position',
          data: positions,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1',
        },
      ],
    };

    const options = {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      stacked: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
        },
      },
    };

    return <Line data={chartData} options={options} />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-grow p-6 w-full max-w-6xl mx-auto">
        {/* Google Script */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places,marker`}
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
        />
        {!mapsApiKey && (
          <div className="text-red-500 mb-4">
            Error: Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.
          </div>
        )}

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold font-libre text-gray-800">
            Learn about your Restaurant
          </h1>
          <p className="mt-2 text-3xl text-black font-bold font-sans">
            Your Restaurant, it’s area and new food trends
          </p>
          <p className="mt-2 text-lg text-black font-sans">
            Understand the food business industry around your Area, find trends and understand how to grow your business.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold font-sans text-black mb-4">Find your Restaurant</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6 md:flex-row items-center md:items-end">
            {/* Restaurant Address */}
            <div className="flex-1 w-full">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Address
              </label>
              <input
                ref={autoCompleteRef}
                id="address"
                type="text"
                value={address}
                placeholder="Enter restaurant address"
                onChange={(e) => setAddress(e.target.value)}
                className="p-3 border rounded-full w-full focus:outline-none focus:ring focus:ring-gray-200"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold transition-all hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-500"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Past Searches */}
          {uniqueRestaurantNames.length > 0 && (
            <div className="mt-4 w-full md:w-auto">
              <label htmlFor="trendSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Past Searches
              </label>
              <select
                id="trendSelect"
                value={selectedRestaurant}
                onChange={(e) => {
                  setSelectedRestaurant(e.target.value);
                  setData(null); // Clear current search data if we re-select
                }}
                className="p-3 border rounded-full w-full md:w-64 focus:outline-none focus:ring focus:ring-gray-200"
              >
                <option value="">Select a restaurant</option>
                {uniqueRestaurantNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Error, if any */}
        {error && <p className="text-red-500 mb-6">{error}</p>}

        {/* If we have some "last search" from DB (or the chosen restaurant), display the chart + last search details ALWAYS. */}
        {lastSearch && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* We'll leave the left column for the map IF data is available (the user said map only if there's a search). */}
            {data ? (
              <div className="bg-gray-50 rounded-lg flex justify-center items-center p-2">
                <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
              </div>
            ) : (
              // If no fresh "data", just show a placeholder on the left
              <div className="flex justify-center items-center rounded-lg p-4 text-gray-500 bg-gray-50">
                (Map will appear here after you perform a new Search)
              </div>
            )}

            {/* Right side: Last Search Details & Chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl sm:text-2xl font-bold font-libre mb-2 sm:mb-4">Last Search Details</h3>
              <p>
                <strong>Restaurant:</strong> {lastSearch.restaurant_name}
              </p>
              <p>
                <strong>Star Rating:</strong> {lastSearch.star_rating}
              </p>
              <p>
                <strong>Position vs Competitors:</strong> {lastSearch.position}
              </p>
              <p>
                <strong>Date:</strong>{' '}
                {new Date(lastSearch.created_at).toLocaleString()}
              </p>

              <div className="mt-4">
                {/* Chart for all data points of this restaurant */}
                <SearchTrendsChart
                  dataPoints={[...filteredTrendData].sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at)
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* If there's absolutely no lastSearch, show an empty state or some message */}
        {!lastSearch && (
          <div className="rounded p-4 text-gray-500 mb-8 bg-gray-50">
            No past searches yet. Try searching for a restaurant above.
          </div>
        )}

        {/* Only show these sections if we have fresh "data" from the current search. */}
        {data && (
          <>
            {/* Restaurant Info & Quick Summary */}
            <div className="rounded-lg bg-white shadow mb-6 p-4">
              <h3 className="text-xl sm:text-2xl font-bold font-libre mb-2 sm:mb-4">Restaurant Information</h3>
              <p className="text-xl font-bold">{data.restaurantInfo?.name}</p>
              <p className="text-gray-700">{data.restaurantInfo?.address}</p>
              <div className="flex items-center mt-2">
                <span className="mr-2">Rating:</span>
                <div className="flex">{renderStars(data.restaurantInfo?.rating)}</div>
                <span className="ml-2 text-sm text-gray-600">
                  ({data.restaurantInfo?.rating ?? 'N/A'}/5)
                </span>
              </div>
              <div className="mt-2 flex items-center">
                <span className="mr-2">Price:</span>
                <span className="font-medium text-gray-800">
                  {data.restaurantInfo?.price_level
                    ? '$'.repeat(data.restaurantInfo?.price_level)
                    : 'N/A'}
                </span>
              </div>
              <div className="mt-2">
                <span className="mr-2">Total Reviews:</span>
                <span>{data.restaurantInfo?.userRatingsTotal ?? 'N/A'}</span>
              </div>
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <h4 className="text-xl font-bold mb-2">Quick Summary</h4>
                {(() => {
                  const restaurantRating = data.restaurantInfo?.rating ?? 0;
                  const nearbyRatings = data.nearbyRestaurants?.map(r => r.rating) ?? [];
                  const allRatings = [...nearbyRatings, restaurantRating].filter(Boolean).sort((a, b) => b - a);
                  const rank = allRatings.indexOf(restaurantRating) + 1;
                  const totalRestaurants = allRatings.length;

                  const priceLevels = data.nearbyRestaurants
                    ?.filter(r => typeof r.price_level === 'number')
                    .map(r => r.price_level) ?? [];
                  if (typeof data.restaurantInfo?.price_level === 'number') {
                    priceLevels.push(data.restaurantInfo.price_level);
                  }
                  const avgPrice = priceLevels.length
                    ? priceLevels.reduce((sum, lvl) => sum + lvl, 0) / priceLevels.length
                    : data.restaurantInfo?.price_level;
                  const isCompetitive =
                    data.restaurantInfo?.price_level && avgPrice
                      ? data.restaurantInfo.price_level <= avgPrice
                      : false;

                  let bestDish = '';
                  if (data.dishInsights && data.dishInsights !== 'No dish insights available') {
                    // Example logic: get the first sentence
                    bestDish = data.dishInsights.split('.')[0];
                  }

                  return (
                    <>
                      <p>
                        Your restaurant is ranked <strong>{rank} of {totalRestaurants}</strong> in the area based on ratings.
                      </p>
                      {priceLevels.length > 0 && (
                        <p>
                          Its price level is <strong>{data.restaurantInfo.price_level}</strong> compared to an area average of <strong>{avgPrice.toFixed(1)}</strong>, making it{' '}
                          {isCompetitive ? (
                            <span className="text-green-600">competitive</span>
                          ) : (
                            <span className="text-red-600">not competitive</span>
                          )}.
                        </p>
                      )}
                      {bestDish && (
                        <p>
                          The best dish according to customer feedback is: <strong>{bestDish}</strong>.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
              <p className="text-xs italic text-gray-600 mt-2">
                Disclaimer: Pricing and ranking data is from publicly available sources (Google) and may not reflect current market conditions.
              </p>
            </div>

            {/* Dish Insights + Area Review Summary side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <section className="rounded-lg bg-white shadow p-4">
                <h3 className="text-xl font-bold mb-2">Dish Insights</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Placeholder: Detailed analysis of popular dishes based on customer reviews.
                </p>
                <div className="bg-gray-50 p-4 rounded">
                  {data.dishInsights
                    ? data.dishInsights.split('\n').map((line, idx) => (
                        <p key={idx} className="mb-2">{line}</p>
                      ))
                    : <p>No dish insights available.</p>}
                </div>
              </section>

              <section className="rounded-lg bg-white shadow p-4">
                <h3 className="text-xl font-bold mb-2">Area Review Summary</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Placeholder: A summary of nearby restaurant reviews will be displayed here.
                </p>
                <div className="whitespace-pre-line">
                  {data.areaReviewSummary || 'No area review summary available.'}
                </div>
              </section>
            </div>

            {/* Nearby Restaurants */}
            <section className="rounded-lg bg-white shadow p-4 mb-6">
              <h3 className="text-xl font-bold mb-2">Nearby Restaurants</h3>
              <p className="text-sm text-gray-500 mb-2">
                Placeholder: A list of nearby restaurants with ratings and pricing.
              </p>

              <div className="mb-4">
                <label htmlFor="filter" className="mr-2 font-medium">
                  Sort by:
                </label>
                <select
                  id="filter"
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                  className="p-2 rounded"
                >
                  <option value="bestRated">Best Rated</option>
                  <option value="moreExpensive">More Expensive</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {data.nearbyRestaurants
                  .slice()
                  .sort((a, b) => {
                    if (filterOption === 'bestRated') {
                      return (b.rating || 0) - (a.rating || 0);
                    } else if (filterOption === 'moreExpensive') {
                      return (b.price_level || 0) - (a.price_level || 0);
                    }
                    return 0;
                  })
                  .map((rest, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-white shadow hover:shadow-md transition-shadow p-4"
                    >
                      <p className="font-bold text-lg">{rest.name}</p>
                      <p className="text-gray-700">{rest.address || rest.vicinity}</p>
                      <div className="flex items-center mt-1">
                        <span className="mr-2">Rating:</span>
                        <div className="flex">{renderStars(rest.rating)}</div>
                        <span className="ml-2 text-sm text-gray-600">
                          ({rest.rating ?? 'N/A'}/5)
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="mr-2">Price:</span>
                        <span className="font-medium text-gray-800">
                          {rest.price_level ? '$'.repeat(rest.price_level) : 'N/A'}
                        </span>
                      </div>
                      {data.restaurantInfo && (
                        <div className="mt-2 text-sm text-gray-700">
                          <span className="block font-medium mb-1">
                            Comparison vs {data.restaurantInfo.name}:
                          </span>
                          <p className="text-gray-600">
                            Rating: {compareRating(rest.rating || 0, data.restaurantInfo.rating || 0)}
                          </p>
                          <p className="text-gray-600">
                            Price: {comparePrice(rest.price_level || 0, data.restaurantInfo.price_level || 0)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
