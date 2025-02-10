'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import Sidebar from '@/components/shared/Sidebar';

export default function RestaurantInsightsPage() {
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const autoCompleteRef = useRef(null);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [circle, setCircle] = useState(null);
  const [filterOption, setFilterOption] = useState('bestRated');

  // Grab the API key and Map ID from the environment.
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

  console.log('Using Map ID:', mapId);

  // Helper function to render the star rating as icons.
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

  const compareRating = (targetRating, mainRating) => {
    const diff = targetRating - mainRating;
    if (diff > 0) {
      return `${diff.toFixed(1)} star(s) higher`;
    } else if (diff < 0) {
      return `${Math.abs(diff).toFixed(1)} star(s) lower`;
    } else {
      return 'Same rating';
    }
  };

  const comparePrice = (targetPrice, mainPrice) => {
    const diff = (targetPrice || 0) - (mainPrice || 0);
    if (diff > 0) {
      return `${diff} level(s) more expensive`;
    } else if (diff < 0) {
      return `${Math.abs(diff)} level(s) cheaper`;
    } else {
      return 'Same price level';
    }
  };

  // Create an advanced marker with an icon
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

  // Initialize the Google Places autocomplete when script loads.
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
      console.log('Google Maps autocomplete initialized');
    } else {
      console.error("Google Maps script didn't load or the input ref is missing.");
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
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
    } catch (err) {
      if (err.message.includes('Restaurant not found')) {
        setError("We couldn't find a restaurant with the provided address. Please double-check the address and try again.");
      } else if (err.message.includes('Address is required')) {
        setError('Please provide an address before searching.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Update or initialize the map once data is available.
  useEffect(() => {
    if (data && window.google && mapRef.current) {
      // Clear previous markers and circles.
      markers.forEach((marker) => {
        if (marker.setMap) {
          marker.setMap(null);
        } else if (marker.element && marker.element.remove) {
          marker.element.remove();
        }
      });
      if (circle) circle.setMap(null);

      // Figure out the center from the restaurant geometry.
      let center;
      if (
        data.restaurantInfo &&
        data.restaurantInfo.geometry &&
        data.restaurantInfo.geometry.location &&
        typeof data.restaurantInfo.geometry.location.lat === 'number' &&
        typeof data.restaurantInfo.geometry.location.lng === 'number'
      ) {
        center = new window.google.maps.LatLng(
          data.restaurantInfo.geometry.location.lat,
          data.restaurantInfo.geometry.location.lng
        );
      } else {
        setError('Could not determine restaurant location.');
        return;
      }

      let map;
      if (!mapInstance) {
        if (!mapId) {
          console.error('A valid Map ID is required for AdvancedMarkerElement.');
        }
        map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          mapId: mapId,
        });
        setMapInstance(map);
      } else {
        map = mapInstance;
        map.setCenter(center);
      }

      const newMarkers = [];

      // Main restaurant marker
      const mainMarker = createAdvancedMarker({
        position: center,
        map,
        title: data.restaurantInfo.name,
        iconUrl: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      });
      newMarkers.push(mainMarker);

      // Markers for nearby restaurants
      if (data.nearbyRestaurants && Array.isArray(data.nearbyRestaurants)) {
        data.nearbyRestaurants.forEach((rest) => {
          if (
            rest.geometry &&
            rest.geometry.location &&
            typeof rest.geometry.location.lat === 'number' &&
            typeof rest.geometry.location.lng === 'number'
          ) {
            const pos = new window.google.maps.LatLng(
              rest.geometry.location.lat,
              rest.geometry.location.lng
            );
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

      // Circle around the main restaurant
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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (if your layout requires it) */}
      <Sidebar />

      <div className="flex-grow p-6 w-full max-w-6xl mx-auto">
        {/* Check if we have an API key */}
        {!mapsApiKey && (
          <div className="text-red-500 mb-4">
            Error: Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.
          </div>
        )}

        {/* Google Maps Script */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places,marker`}
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
        />

        {/* Page Header */}
        <div className="mb-8">
            <h1 className="text-5xl font-bold font-libre text-gray-800">
                Learn about your Restaurant
            </h1>
            
            <p className="mt-2 text-3xl text-black font-bold font-sans">
                Your Restaurant, it's Area and new food trends
            </p>
            
            <p className="mt-2 text-lg text-black font-sans">
                Understand the food business industry around your Area, find trends and understand how to grow your business.
            </p>
        </div>

        {/* Address Input Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-bold font-sans text-black mb-4">Find your Restaurant</h2>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
            <div className="w-full sm:w-3/4">
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
                className="p-2 border rounded w-full"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold transition-all hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-500 flex justify-center items-center"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Map & Restaurant Info in One Row */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Map (left) */}
          <div className="md:w-2/3 w-full">
            <div
              ref={mapRef}
              style={{ height: '500px', width: '100%' }}
              className="border rounded-lg"
            />
          </div>

          {/* Restaurant Info (right) */}
          {data && (
            <div className="md:w-1/3 w-full flex flex-col gap-6">
              {loading && <p className="text-lg text-gray-700">Loading...</p>}
              {error && <p className="text-red-500">{error}</p>}

              {/* Restaurant Information */}
              <div className="border p-4 rounded-lg bg-white shadow">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Restaurant Information</h3>
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
              </div>

              {/* Quick Summary Section */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Quick Summary</h3>
                {(() => {
                  // Calculate ranking based on ratings.
                  const restaurantRating = data.restaurantInfo.rating;
                  const nearbyRatings = data.nearbyRestaurants.map((r) => r.rating);
                  const allRatings = [...nearbyRatings, restaurantRating].sort((a, b) => b - a);
                  const rank = allRatings.indexOf(restaurantRating) + 1;
                  const totalRestaurants = allRatings.length;
                  // Calculate the average price level.
                  const priceLevels = data.nearbyRestaurants
                    .filter((r) => typeof r.price_level === 'number')
                    .map((r) => r.price_level);
                  if (typeof data.restaurantInfo.price_level === 'number') {
                    priceLevels.push(data.restaurantInfo.price_level);
                  }
                  const avgPrice = priceLevels.length
                    ? priceLevels.reduce((sum, lvl) => sum + lvl, 0) / priceLevels.length
                    : data.restaurantInfo.price_level;
                  const isCompetitive = data.restaurantInfo.price_level <= avgPrice;
                  // Extract best dish from dish insights (assume the first sentence contains a dish name).
                  let bestDish = "";
                  if (data.dishInsights && data.dishInsights !== "No dish insights available") {
                    bestDish = data.dishInsights.split('.')[0];
                  }
                  return (
                    <>
                      <p>
                        Your restaurant is ranked <strong>{rank} of {totalRestaurants}</strong> in the area based on ratings.
                      </p>
                      <p>
                        Its price level is <strong>{data.restaurantInfo.price_level}</strong> compared to an area average of <strong>{avgPrice.toFixed(1)}</strong>, making it {isCompetitive ? <span className="text-green-600">competitive</span> : <span className="text-red-600">not competitive</span>}.
                      </p>
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
                Disclaimer: The pricing and ranking data is sourced from publicly available web data (Google) and reflects aggregated customer reviews, which may not represent current market conditions.
              </p>
            </div>
          )}
        </div>

        {/* If we have data, display the rest in a single column below */}
        {data && (
          <div className="flex flex-col gap-6">
            {/* Dish Insights */}
            <section className="border p-4 rounded-lg bg-white shadow">
              <h3 className="text-xl font-bold mb-2">Dish Insights</h3>
              <p className="text-sm text-gray-500 mb-2">
                Placeholder: Detailed analysis of popular dishes based on customer reviews will be shown here.
              </p>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                {data.dishInsights
                  ? data.dishInsights.split('\n').map((line, idx) => <p key={idx} className="mb-2">{line}</p>)
                  : <p>No dish insights available.</p>}
              </div>
            </section>

            {/* Pricing Comparison */}
            <section className="border p-4 rounded-lg bg-white shadow">
              <h3 className="text-xl font-bold mb-2">Pricing Comparison</h3>
              <p className="text-sm text-gray-500 mb-2">
                Placeholder: Comparison of the restaurant's price level with the average nearby price will be displayed here.
              </p>
              <div>{data.pricingComparison || 'Not available'}</div>
            </section>

            {/* Area Review Summary */}
            <section className="border p-4 rounded-lg bg-white shadow">
              <h3 className="text-xl font-bold mb-2">Area Review Summary</h3>
              <p className="text-sm text-gray-500 mb-2">
                Placeholder: A summary of reviews from other nearby restaurants will be provided here.
              </p>
              <div className="whitespace-pre-line">
                {data.areaReviewSummary || 'No area review summary available.'}
              </div>
            </section>

            {/* Nearby Restaurants */}
            <section className="border p-4 rounded-lg bg-white shadow">
              <h3 className="text-xl font-bold mb-2">Nearby Restaurants</h3>
              <p className="text-sm text-gray-500 mb-2">
                Placeholder: A list of restaurants located nearby, along with key details like ratings and pricing, will be shown here.
              </p>
              <div className="mb-4">
                <label htmlFor="filter" className="mr-2 font-medium">
                  Sort by:
                </label>
                <select
                  id="filter"
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                  className="p-2 border rounded"
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
                      className="border p-4 rounded-lg bg-white shadow hover:shadow-md transition-shadow"
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
                            Price:{' '}
                            {comparePrice(rest.price_level || 0, data.restaurantInfo.price_level || 0)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
