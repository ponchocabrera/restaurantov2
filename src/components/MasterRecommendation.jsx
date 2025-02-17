import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./MasterRecommendation.css"; // Ensure to create this CSS file

function CollapsibleBox({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="collapsible-box">
      <div className="box-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>{title}</h3>
        <span className="icon">{isOpen ? "▼" : "▶"}</span>
      </div>
      {isOpen && <div className="box-content">{children}</div>}
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
      <h2>Master Recommendations</h2>
      {loading && (
        <p>
          Loading recommendations. This process might take a while, so please do
          not refresh the page.
        </p>
      )}
      {!restaurantName && (
        <p>Please select a restaurant before generating master recommendations.</p>
      )}
      {restaurantName && !recommendations && !loading && (
        <button onClick={handleGenerateRecommendations}>
          Generate Recommendations
        </button>
      )}
      {error &&
        (error === "Missing analysis or search data." ? (
          <p>
            Please create a restaurant search and a menu analysis to see the overall
            recommendations.
          </p>
        ) : (
          <p>Error: {error}</p>
        ))}
      {recommendations && (
        <div className="recommendations-grid">
          <CollapsibleBox title="Star Dishes & Menu Analysis">
            <ReactMarkdown>{recommendations.starDishRecommendation}</ReactMarkdown>
          </CollapsibleBox>
          <CollapsibleBox title="Dish-Specific Insights">
            <ReactMarkdown>{recommendations.dishInsightsRecommendation}</ReactMarkdown>
          </CollapsibleBox>
          <CollapsibleBox title="Area Opportunities">
            <ReactMarkdown>{recommendations.areaOpportunityRecommendation}</ReactMarkdown>
          </CollapsibleBox>
          <CollapsibleBox title="Local Food Trends">
            <ReactMarkdown>{recommendations.localTrendRecommendation}</ReactMarkdown>
          </CollapsibleBox>
        </div>
      )}
    </div>
  );
} 