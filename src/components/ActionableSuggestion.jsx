// src/components/ActionableSuggestion.jsx
import React from 'react';

function ActionableSuggestion({ latestSearch, latestAnalysis }) {
  let suggestion = "";

  if (latestSearch) {
    suggestion += `Your recent market search on ${new Date(latestSearch.created_at).toLocaleDateString()} for "${latestSearch.restaurant_name}" indicated a star rating of ${latestSearch.star_rating || 'N/A'}. `;
  }

  if (latestAnalysis) {
    const analysisDate = new Date(latestAnalysis.created_at).toLocaleDateString();
    suggestion += `Your latest menu analysis from ${analysisDate} revealed several areas for improvement. `;

    if (latestAnalysis.recommendations && typeof latestAnalysis.recommendations === 'object') {
      const recEntries = Object.entries(latestAnalysis.recommendations)
        .filter(([key, recs]) => Array.isArray(recs) && recs.length > 0);

      if (recEntries.length > 0) {
        suggestion += `Key recommendation areas include: `;
        recEntries.forEach(([area, recs]) => {
          const recTexts = recs
            .map(rec => (typeof rec === 'object' ? rec.recommendation : rec))
            .slice(0, 2);
          suggestion += `${area} (${recTexts.join('; ')}), `;
        });
        suggestion = suggestion.replace(/, $/, '. ');
      }
    }

    suggestion += `\n\nDetailed Recommendations:\n`;
    if (latestAnalysis.recommendations && typeof latestAnalysis.recommendations === 'object') {
      const recEntries = Object.entries(latestAnalysis.recommendations)
        .filter(([key, recs]) => Array.isArray(recs) && recs.length > 0);

      recEntries.forEach(([area, recs]) => {
        const recTexts = recs.map(rec => (typeof rec === 'object' ? rec.recommendation : rec));
        suggestion += `- ${area}:\n    • ${recTexts.join('\n    • ')}\n`;
      });
    }

    suggestion += `\nConsider revisiting these aspects to boost customer satisfaction and revenue.`;
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-outfit-bold mb-4 text-[#212350]">
        Actionable Suggestion
      </h2>
      <div className="p-8 bg-gradient-to-br from-[#1D2C40] to-[#354861] text-white rounded-2xl flex-grow flex flex-col justify-between shadow-xl">
        <p className="whitespace-pre-line">{suggestion}</p>
      </div>
    </div>
  );
}

export default ActionableSuggestion;