import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./MasterRecommendation.css"; // optional CSS

// A simple Card for each recommendation (no local dropdown state)
function RecommendationCard({ index, title, subtitle, icon, error, activeIndex, setActiveIndex }) {
  const isActive = activeIndex === index;

  return (
    <div
      className={`
        cursor-pointer rounded bg-white shadow-sm p-4
        transition-all hover:shadow-md
        ${isActive ? "ring-2 ring-blue-300" : ""}
      `}
      onClick={() => setActiveIndex(isActive ? null : index)}
    >
      <div className="flex items-start space-x-3">
        <img
          src={icon}
          alt="icon"
          className="w-12 h-12 object-contain"
        />
        <div>
          <h3 className="font-semibold text-base sm:text-lg mb-1">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
          {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MasterRecommendation({ restaurantName }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // This state tracks which card is open (0 to 3), or null if none are open
  const [activeIndex, setActiveIndex] = useState(null);

  const handleGenerateRecommendations = async () => {
    if (!restaurantName) {
      setError("Please select a restaurant before generating recommendations.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/generateMasterRecommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customContext: "", restaurantName })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load recommendations.");
      }
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // So we know which recommendation keys map to each card index
  const contentMap = [
    { key: "starDishRecommendation", title: "Star Dishes & Menu Analysis" },
    { key: "dishInsightsRecommendation", title: "Dish-Specific Insights" },
    { key: "areaOpportunityRecommendation", title: "Area Opportunities" },
    { key: "localTrendRecommendation", title: "Local Food Trends" },
  ];

  // If a card is selected, pick out its recommendation text
  let expandedContent = "";
  if (activeIndex !== null && recommendations) {
    const recKey = contentMap[activeIndex].key;
    expandedContent = recommendations[recKey] || "";
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Master Recommendations</h2>
      {loading && <p>Loading recommendations…</p>}

      {!restaurantName && !loading && (
        <p>Please select a restaurant before generating master recommendations.</p>
      )}

      {error &&
        (error === "Missing analysis or search data." ? (
          <p>Please create a restaurant search and a menu analysis first.</p>
        ) : (
          <p className="text-red-500">Error: {error}</p>
        ))
      }

      {/* 4 recommendation cards in one row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <RecommendationCard
          index={0}
          title="Star Dishes & Menu Analysis"
          subtitle="Generate Restaurant Review and Menu Analysis to view"
          icon="/assets/icons/stardishesandmenu.png"
          error={error}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
        <RecommendationCard
          index={1}
          title="Dish-Specific Insights"
          subtitle="Generate Restaurant Review and Menu Analysis to view"
          icon="/assets/icons/dishspecificinsights.png"
          error={error}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
        <RecommendationCard
          index={2}
          title="Area Opportunities"
          subtitle="Generate Restaurant Review and Menu Analysis to view"
          icon="/assets/icons/restaurant_locations.png"
          error={error}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
        <RecommendationCard
          index={3}
          title="Local Food Trends"
          subtitle="Generate Restaurant Review and Menu Analysis to view"
          icon="/assets/icons/localfoodtrends.png"
          error={error}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
      </div>

      {/* Generate button BELOW the cards */}
      {restaurantName && !recommendations && !loading && (
        <div className="mt-6">
          <button
            onClick={handleGenerateRecommendations}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#222452] to-[#42469F] text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Generate Recommendations
          </button>
        </div>
      )}

      {/* Expanded dropdown area for the currently selected card */}
      {activeIndex !== null && (
        <div className="mt-6 p-4 rounded-lg bg-white shadow">
          <h3 className="font-bold text-lg mb-2">
            {contentMap[activeIndex].title}
          </h3>
          {expandedContent ? (
            <ReactMarkdown>{expandedContent}</ReactMarkdown>
          ) : (
            <p className="text-gray-500">
              No data yet. Please generate recommendations or select a different card.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
