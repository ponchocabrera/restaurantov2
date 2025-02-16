import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function MasterRecommendation() {
  const [masterRecommendation, setMasterRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMasterRecommendation() {
      setLoading(true);
      try {
        const response = await fetch("/api/ai/generateMasterRecommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // If you have additional context, you can pass it here:
          body: JSON.stringify({ customContext: "" }),
        });

        if (!response.ok) {
          throw new Error("Failed to load master recommendation.");
        }

        const data = await response.json();
        setMasterRecommendation(data.masterRecommendation);
      } catch (err) {
        console.error("Error fetching master recommendation:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMasterRecommendation();
  }, []);

  return (
    <div>
      <h2>Master Recommendation</h2>
      {loading && <p>Loading master recommendation...</p>}
      {error && <p>Error: {error}</p>}
      {masterRecommendation && (
        <div className="recommendation">
          <ReactMarkdown>{masterRecommendation}</ReactMarkdown>
        </div>
      )}
    </div>
  );
} 