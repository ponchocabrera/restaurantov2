import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import MenuChat from './MenuChat';

export default function StepRecommendations({ 
  analysis,
  recommendations,
  isLoading
}) {
  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">AI Menu Recommendations</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Research-backed suggestions to improve your menu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Psychology & Colors */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h4 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Menu Psychology & Colors</h4>
          <ul className="space-y-3 sm:space-y-4">
            {recommendations?.psychology?.map((rec, index) => (
              <RecommendationItem key={index} recommendation={rec} />
            ))}
          </ul>
        </div>

        {/* Layout & Design */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h4 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Layout & Design</h4>
          <ul className="space-y-3 sm:space-y-4">
            {recommendations?.design?.map((rec, index) => (
              <RecommendationItem key={index} recommendation={rec} />
            ))}
          </ul>
        </div>

        {/* Menu Engineering */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h4 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Menu Engineering</h4>
          <ul className="space-y-3 sm:space-y-4">
            {recommendations?.engineering?.map((rec, index) => (
              <RecommendationItem key={index} recommendation={rec} />
            ))}
          </ul>
        </div>

        {/* Pricing Strategy */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h4 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Pricing Strategy</h4>
          <ul className="space-y-3 sm:space-y-4">
            {recommendations?.pricing?.map((rec, index) => (
              <RecommendationItem key={index} recommendation={rec} />
            ))}
          </ul>
        </div>

        {/* Visual Hierarchy */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h4 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Visual Hierarchy</h4>
          <ul className="space-y-3 sm:space-y-4">
            {recommendations?.visualHierarchy?.map((rec, index) => (
              <RecommendationItem key={index} recommendation={rec} />
            ))}
          </ul>
        </div>

        {/* Customer Experience */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h4 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Customer Experience</h4>
          <ul className="space-y-3 sm:space-y-4">
            {recommendations?.customerExperience?.map((rec, index) => (
              <RecommendationItem key={index} recommendation={rec} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Extracted RecommendationItem component for cleaner code
function RecommendationItem({ recommendation }) {
  return (
    <li className="space-y-1 sm:space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-1">
          {recommendation.priority?.toLowerCase() === 'high' && (
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
          )}
          {recommendation.priority?.toLowerCase() === 'medium' && (
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full" />
          )}
          {recommendation.priority?.toLowerCase() === 'low' && (
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>
        <div>
          <span className="text-gray-900 font-medium text-sm sm:text-base">
            {recommendation.recommendation}
          </span>
          {recommendation.reasoning && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Why: {recommendation.reasoning}
            </p>
          )}
          {recommendation.impact && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Impact: {recommendation.impact}
            </p>
          )}
        </div>
      </div>
    </li>
  );
} 