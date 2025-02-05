import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import MenuChat from './MenuChat';

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
          <ul className="space-y-4">
            {recommendations?.psychology?.filter((rec, index, self) => 
              index === self.findIndex(r => r.recommendation === rec.recommendation)
            ).map((rec, index) => (
              <li key={index} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <div>
                    <span className="text-gray-900 font-medium">{rec.recommendation}</span>
                    {rec.reasoning && (
                      <p className="text-sm text-gray-600 mt-1">
                        Why: {rec.reasoning}
                      </p>
                    )}
                    {rec.impact && (
                      <p className="text-sm text-gray-500 mt-1">
                        Impact: {rec.impact}
                      </p>
                    )}
                    {rec.priority && (
                      <p className="text-xs text-gray-400 mt-1">
                        Priority: {rec.priority}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Layout & Design */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Layout & Design</h4>
          <ul className="space-y-4">
            {recommendations?.design?.filter((rec, index, self) => 
              index === self.findIndex(r => r.recommendation === rec.recommendation)
            ).map((rec, index) => (
                <li key={index} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <div>
                    <span className="text-gray-900 font-medium">{rec.recommendation}</span>
                    {rec.reasoning && (
                      <p className="text-sm text-gray-600 mt-1">
                        Why: {rec.reasoning}
                      </p>
                    )}
                    {rec.impact && (
                      <p className="text-sm text-gray-500 mt-1">
                        Impact: {rec.impact}
                      </p>
                    )}
                    {rec.priority && (
                      <p className="text-xs text-gray-400 mt-1">
                        Priority: {rec.priority}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Menu Engineering */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Menu Engineering</h4>
          <ul className="space-y-4">
            {recommendations?.engineering?.filter((rec, index, self) => 
              index === self.findIndex(r => r.recommendation === rec.recommendation)
            ).map((rec, index) => (
               <li key={index} className="space-y-2">
               <div className="flex items-start gap-2">
                 <span className="text-blue-500 mt-1">•</span>
                 <div>
                   <span className="text-gray-900 font-medium">{rec.recommendation}</span>
                   {rec.reasoning && (
                     <p className="text-sm text-gray-600 mt-1">
                       Why: {rec.reasoning}
                     </p>
                   )}
                   {rec.impact && (
                     <p className="text-sm text-gray-500 mt-1">
                       Impact: {rec.impact}
                     </p>
                   )}
                   {rec.priority && (
                     <p className="text-xs text-gray-400 mt-1">
                       Priority: {rec.priority}
                     </p>
                   )}
                 </div>
               </div>
             </li>
           ))}
          </ul>
        </div>

        {/* Pricing Strategy */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Pricing Strategy</h4>
          <ul className="space-y-4">
            {recommendations?.pricing?.filter((rec, index, self) => 
              index === self.findIndex(r => r.recommendation === rec.recommendation)
            ).map((rec, index) => (
               <li key={index} className="space-y-2">
               <div className="flex items-start gap-2">
                 <span className="text-blue-500 mt-1">•</span>
                 <div>
                   <span className="text-gray-900 font-medium">{rec.recommendation}</span>
                   {rec.reasoning && (
                     <p className="text-sm text-gray-600 mt-1">
                       Why: {rec.reasoning}
                     </p>
                   )}
                   {rec.impact && (
                     <p className="text-sm text-gray-500 mt-1">
                       Impact: {rec.impact}
                     </p>
                   )}
                   {rec.priority && (
                     <p className="text-xs text-gray-400 mt-1">
                       Priority: {rec.priority}
                     </p>
                   )}
                 </div>
               </div>
             </li>
           ))}
          </ul>
        </div>

        <div className="col-span-2 mt-6">
          <MenuChat analysis={analysis} recommendations={recommendations} />
        </div>
      </div>
    </section>
  );

  
} 