import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import OpenAI from 'openai';
import { saveRestaurantSearch } from '@/db';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function geocodeAddress(address) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_MAPS_API_KEY}`
  );
  const data = await res.json();
  console.log('Geocode response:', data);
  if (data.status !== 'OK' || data.results.length === 0) {
    throw new Error('Geocoding failed');
  }
  return data.results[0];
}

async function findRestaurant(placeQuery) {
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
    placeQuery
  )}&inputtype=textquery&fields=place_id,formatted_address,name,geometry,price_level,rating,user_ratings_total&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('FindRestaurant response:', data);
  if (data.status !== 'OK' || data.candidates.length === 0) {
    throw new Error('Restaurant not found');
  }
  return data.candidates[0];
}

async function getRestaurantDetails(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,price_level,user_ratings_total,formatted_address,name,geometry&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('Restaurant Details response:', data);
  if (data.status !== 'OK' || !data.result) {
    throw new Error("Couldn't fetch restaurant details");
  }
  return data.result;
}

async function getNearbyRestaurants(lat, lng) {
  const radius = 1500;
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('NearbyRestaurants response:', data);
  if (data.status !== 'OK') {
    throw new Error('Nearby search failed');
  }
  return data.results;
}

async function getDishInsights(reviewsText) {
  const prompt = `Analyze the following restaurant reviews and extract dish insights:
Reviews: ${reviewsText}

For each dish mentioned, list the dish name, customer sentiment (positive, neutral, negative), and any key ingredients mentioned.`;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are an expert food reviewer and data processor.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 500,
  });
  
  return completion.choices[0].message.content.trim();
}

// NEW FUNCTION: Aggregates reviews from a few nearby restaurants and summarizes trends.
async function getAreaReviewSummary(nearbyRestaurants) {
  // Limit the number of nearby restaurants to query (for rate limits and speed)
  const reviewsArray = [];
  const limit = Math.min(3, nearbyRestaurants.length);
  for (let i = 0; i < limit; i++) {
    try {
      const placeId = nearbyRestaurants[i].place_id;
      if (!placeId) continue;
      const details = await getRestaurantDetails(placeId);
      if (details.reviews && details.reviews.length > 0) {
        const reviewText = details.reviews.map(review => review.text).join('\n');
        reviewsArray.push(reviewText);
      }
    } catch (error) {
      console.error('Error fetching details for nearby restaurant:', error);
    }
  }
  if (reviewsArray.length === 0) {
    return 'No area reviews available.';
  }
  const aggregatedReviews = reviewsArray.join('\n');
  const prompt = `The following are customer reviews from several nearby restaurants in the area:

${aggregatedReviews}

Please provide a summary of the common trends among these restaurants. Focus on aspects such as ambiance, food quality, service, popular dishes, and any noticeable patterns.`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert food reviewer and data analyst.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating area review summary:', error);
    return 'Failed to generate area review summary.';
  }
}

export async function POST(request) {
  try {
    // Get the user session – only logged-in users can save searches.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { address } = await request.json();
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    
    console.log('Received address:', address);
    
    // DEV fallback if testing
    if (process.env.NODE_ENV === 'development' && address.toLowerCase() === 'test') {
      const mockRestaurant = {
        name: 'Test Restaurant',
        formatted_address: '123 Test Ave, Test City, TS',
        rating: 4.2,
        user_ratings_total: 50,
        price_level: 2,
        reviews: [
          { text: "The pizza was amazing with a delightful, crispy crust and rich tomato sauce." },
          { text: "Great pasta and a cozy ambience." }
        ],
        geometry: { location: { lat: 37.7749, lng: -122.4194 } },
      };
      const mockNearby = [
        {
          name: 'Nearby Test Restaurant',
          vicinity: '456 Test Blvd, Test City, TS',
          rating: 4.0,
          price_level: 2,
          place_id: 'test-nearby-1'
        },
      ];
      const result = {
        restaurantInfo: { ...mockRestaurant },
        nearbyRestaurants: mockNearby,
        dishInsights: 'Test dish insights from reviews.',
        pricingComparison: 'Test pricing comparison.',
        areaReviewSummary: 'Test summary of trends for nearby restaurants.'
      };
      return NextResponse.json({ data: result });
    }
    
    // 1. Geocode the address
    const geoData = await geocodeAddress(address);
    const { lat, lng } = geoData.geometry.location;
    
    // 2. Find the target restaurant
    const restaurantCandidate = await findRestaurant(address);
    
    // 3. Get restaurant details (including rating)
    const restaurant = await getRestaurantDetails(restaurantCandidate.place_id);
    console.log('Fetched Restaurant Details:', restaurant);
    
    // 4. Retrieve nearby restaurants using the coordinates.
    const nearbyRestaurants = await getNearbyRestaurants(lat, lng);
    
    // 5. (Optional) Generate dish insights if reviews are available…
    let dishInsights = 'No dish insights available';
    if (restaurant.reviews && restaurant.reviews.length > 0) {
      const reviewsText = restaurant.reviews.map(review => review.text).join('\n');
      try {
        dishInsights = await getDishInsights(reviewsText);
      } catch (insightsError) {
        console.error('Error generating dish insights:', insightsError);
      }
    }
    
    // 6. Pricing comparison (omitted for brevity)
    
    // 7. Calculate "position" of the restaurant using star ratings.
    const restaurantRating = restaurant.rating;
    const nearbyRatings = nearbyRestaurants.map(r => r.rating).filter(r => r != null);
    const allRatings = [...nearbyRatings, restaurantRating].sort((a, b) => b - a);
    const rank = allRatings.indexOf(restaurantRating) + 1;
    
    // Save search trend for the current user.
    await saveRestaurantSearch(session.user.id, restaurant.name, restaurant.rating, rank);
    
    const result = {
      restaurantInfo: {
        name: restaurant.name,
        address: restaurant.formatted_address,
        geometry: restaurant.geometry,
        rating: restaurant.rating,
        userRatingsTotal: restaurant.user_ratings_total,
        price_level: restaurant.price_level,
        reviews: restaurant.reviews ? restaurant.reviews.slice(0, 3) : [],
      },
      nearbyRestaurants: nearbyRestaurants.map(r => ({
        name: r.name,
        address: r.vicinity,
        rating: r.rating,
        price_level: r.price_level,
      })),
      dishInsights,
      pricingComparison: 'Not available', // or computed as needed
      areaReviewSummary: 'No area review summary available'
    };
    
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in restaurant insights API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 