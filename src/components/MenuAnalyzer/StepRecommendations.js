import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function StepRecommendations({ 
  analysis,
  recommendations,
  isLoading
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">AI Menu Recommendations</h3>
          <p className="text-sm text-gray-600 mt-1">Research-backed suggestions to improve your menu</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Psychology & Colors */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Menu Psychology & Colors</h4>
          <ul className="space-y-3">
            {recommendations?.psychology?.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span className="text-gray-700">
                  <span className="font-medium">{rec.split(':')[0]}:</span>
                  {rec.split(':').slice(1).join(':')}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Layout & Design */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Layout & Design</h4>
          <ul className="space-y-3">
            {recommendations?.design?.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span className="text-gray-700">
                  <span className="font-medium">{rec.split(':')[0]}:</span>
                  {rec.split(':').slice(1).join(':')}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Menu Engineering */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Menu Engineering</h4>
          <ul className="space-y-3">
            {recommendations?.engineering?.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-500">•</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing Strategy */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Pricing Strategy</h4>
          <ul className="space-y-3">
            {recommendations?.pricing?.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span className="text-gray-700">
                  <span className="font-medium">{rec.split(':')[0]}:</span>
                  {rec.split(':').slice(1).join(':')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
} 