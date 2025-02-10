import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import MenuChat from './MenuChat';

export default function StepRecommendations({ 
  analysis,
  recommendations,
  isLoading
}) {
  const sections = [
    { key: 'psychology', title: 'Menu Psychology & Colors' },
    { key: 'design', title: 'Layout & Design' },
    { key: 'engineering', title: 'Menu Engineering' },
    { key: 'pricing', title: 'Pricing Strategy' },
    { key: 'visualHierarchy', title: 'Visual Hierarchy' },
    { key: 'customerExperience', title: 'Customer Experience' }
  ];

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">AI Menu Recommendations</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Research-backed suggestions to improve your menu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {sections.map(({ key, title }) => (
          <div key={key} className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h4 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">{title}</h4>
            <ul className="space-y-3 sm:space-y-4">
              {recommendations?.[key]?.map((rec, index) => (
                <RecommendationItem key={`${key}-${index}`} recommendation={rec} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <MenuChat analysis={analysis} recommendations={recommendations} />
      </div>
    </section>
  );
}

function RecommendationItem({ recommendation }) {
  if (typeof recommendation === 'string') {
    return <li className="text-sm text-gray-700">{recommendation}</li>;
  }

  return (
    <li className="text-sm">
      <p className="font-medium text-gray-900">{recommendation.recommendation}</p>
      {recommendation.reasoning && (
        <p className="text-gray-600 mt-1">Why: {recommendation.reasoning}</p>
      )}
      {recommendation.impact && (
        <p className="text-gray-600">Impact: {recommendation.impact}</p>
      )}
      {recommendation.priority && (
        <p className={`text-${recommendation.priority.toLowerCase() === 'high' ? 'red' : 'gray'}-600`}>
          Priority: {recommendation.priority}
        </p>
      )}
    </li>
  );
} 