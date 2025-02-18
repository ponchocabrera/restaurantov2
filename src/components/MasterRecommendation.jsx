import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./MasterRecommendation.css"; // Make sure this file is updated or remove if not needed

function CollapsibleBox({ title, subtitle, icon, error, content }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="collapsible-box cursor-pointer rounded border bg-white shadow-sm p-4"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="box-header flex items-start space-x-3">
        {/* Top-left icon */}
        <img
          src={icon}
          alt="icon"
          className="icon-placeholder w-12 h-12 object-contain"
        />
        {/* Title and subtitle */}
        <div>
          <h3 className="box-title font-semibold text-base sm:text-lg mb-1">
            {title}
          </h3>
          {subtitle && (
            <p className="subtitle text-sm text-gray-600">{subtitle}</p>
          )}
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      </div>

      {/* Collapsible content */}
      {isOpen && (
        <div className="box-content mt-3 text-sm text-gray-700">
          {content && content.trim().length > 0 ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className="text-gray-500">
              No data yet. Please generate recommendations.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MasterRecommendation({ restaurantName }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Master Recommendations</h2>

      {/* If loading is in progress, show a spinner or text */}
      {loading && <p>Loading recommendations…</p>}

      {/* If no restaurant name is present, prompt the user */}
      {!restaurantName && !loading && (
        <p>Please select a restaurant before generating master recommendations.</p>
      )}

      {/* Show any error messages */}
      {error &&
        (error === "Missing analysis or search data." ? (
          <p>Please create a restaurant search and a menu analysis first.</p>
        ) : (
          <p className="text-red-500">Error: {error}</p>
        ))
      }

      {/* 4 recommendation cards (placeholders or with data) */}
      <div
        // One column on small screens, two columns on medium, up to four on large
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-4"
      >
        <CollapsibleBox
          title="Star Dishes & Menu Analysis"
          subtitle="Generate Restaurant Review and Menu Analysis to view"
          icon="/assets/icons/stardishesandmenu.png"
          error={error}
          content={recommendations?.starDishRecommendation ?? ""}
        />
        <CollapsibleBox
          title="Dish-Specific Insights"
          subtitle="Generate Restaurant Review and Menu Analysis to view"
          icon="/assets/icons/dishspecificinsights.png"
          error={error}
          content={recommendations?.dishInsightsRecommendation ?? ""}
        />
        <CollapsibleBox
          title="Area Opportunities"
          subtitle="Generate Restaurant Review and Menu Analysis to view"
          icon="/assets/icons/restaurant_locations.png"
          error={error}
          content={recommendations?.areaOpportunityRecommendation ?? ""}
        />
        <CollapsibleBox
          title="Local Food Trends"
          subtitle="Generate Restaurant Review and Menu Analysis to view"
          icon="/assets/icons/localfoodtrends.png"
          error={error}
          content={recommendations?.localTrendRecommendation ?? ""}
        />
      </div>

      {/* Generate button BELOW the cards */}
      {restaurantName && !recommendations && !loading && (
        <div className="mt-6">
          <button
            onClick={handleGenerateRecommendations}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Generate Recommendations
          </button>
        </div>
      )}
    </div>
  );
}
