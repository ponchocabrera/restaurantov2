import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';

export default function ZoneUpdates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUpdateId, setExpandedUpdateId] = useState(null);
  
  useEffect(() => {
    async function fetchZoneUpdates() {
      try {
        const res = await fetch('/api/zone-updates');
        if (!res.ok) throw new Error('Failed to fetch zone updates');
        const data = await res.json();
        setUpdates(data.updates || []);
      } catch (error) {
        console.error('Error fetching zone updates:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchZoneUpdates();
  }, []);
  
  const toggleExpand = (id) => {
    setExpandedUpdateId(expandedUpdateId === id ? null : id);
  };
  
  if (loading) {
    return <div className="text-center py-4">Loading zone updates...</div>;
  }
  
  if (updates.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-600">No zone updates available yet.</p>
        <p className="text-sm text-gray-500 mt-2">
          We'll check for changes in your restaurant's area weekly and notify you of any significant updates.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {updates.map((update) => {
        const isExpanded = expandedUpdateId === update.id;
        
        // Find the previous search to compare with
        const previousSearch = updates.find(
          u => u.restaurant_name === update.restaurant_name && 
               u.created_at < update.created_at
        );
        
        // If we can't find a previous search, we can't show changes
        if (!previousSearch) return null;
        
        const ratingChanged = update.star_rating !== previousSearch.star_rating;
        const rankChanged = update.position !== previousSearch.position;
        const areaInsightsChanged = update.area_insights !== previousSearch.area_insights;
        
        // Only show updates with actual changes
        if (!ratingChanged && !rankChanged && !areaInsightsChanged) return null;
        
        return (
          <div 
            key={update.id} 
            className="border rounded-lg overflow-hidden border-amber-300"
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer bg-amber-50"
              onClick={() => toggleExpand(update.id)}
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <h4 className="font-medium">{update.restaurant_name}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(update.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {ratingChanged && (
                  <div className="text-sm">
                    <span className="font-medium">Rating:</span>{' '}
                    <span className={update.star_rating > previousSearch.star_rating ? 'text-green-600' : 'text-red-600'}>
                      {previousSearch.star_rating} → {update.star_rating}
                    </span>
                  </div>
                )}
                
                {rankChanged && (
                  <div className="text-sm">
                    <span className="font-medium">Rank:</span>{' '}
                    <span className={update.position < previousSearch.position ? 'text-green-600' : 'text-red-600'}>
                      {previousSearch.position} → {update.position}
                    </span>
                  </div>
                )}
                
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
            
            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="space-y-4">
                  {/* Rating Change */}
                  {ratingChanged && (
                    <div>
                      <h5 className="font-medium">Rating Change</h5>
                      <p className="mt-1">
                        Your restaurant's rating has changed from <strong>{previousSearch.star_rating}</strong> to <strong>{update.star_rating}</strong>.
                        {update.star_rating > previousSearch.star_rating 
                          ? ' This is a positive development! Your efforts are being recognized by customers.'
                          : ' This suggests an opportunity to address recent customer feedback.'}
                      </p>
                    </div>
                  )}
                  
                  {/* Rank Change */}
                  {rankChanged && (
                    <div>
                      <h5 className="font-medium">Competitive Position Change</h5>
                      <p className="mt-1">
                        Your restaurant's position among nearby competitors has moved from <strong>#{previousSearch.position}</strong> to <strong>#{update.position}</strong>.
                        {update.position < previousSearch.position 
                          ? ' You\'re moving up in the rankings! Keep up the good work.'
                          : ' Your competitors may be improving their offerings or ratings.'}
                      </p>
                    </div>
                  )}
                  
                  {/* Area Insights */}
                  {areaInsightsChanged && (
                    <div>
                      <h5 className="font-medium">New Area Trends</h5>
                      <div className="mt-1 bg-gray-50 p-3 rounded text-sm">
                        {update.area_insights}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 