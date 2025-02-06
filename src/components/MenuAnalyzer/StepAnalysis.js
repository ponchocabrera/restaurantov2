import { useEffect } from 'react';
import { RefreshCw, ArrowRight, Layout, Palette, DollarSign, Eye, FileText } from 'lucide-react';
import EnhancedProgressBar from '@/components/shared/EnhancedProgressBar';

export default function StepAnalysis({ 
  menuData, 
  analysis, 
  isAnalyzing,
  progress,
  estimatedTime,
  onAnalyze,
  onNext
}) {
  const hasNoData = analysis && Object.values(analysis).every(section => 
    !section || (Array.isArray(section) && section.length === 0)
  );

  const handleRetry = () => {
    onAnalyze();
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Menu Analysis Results</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">AI-powered insights for your menu</p>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || !menuData}
          className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg flex items-center justify-center sm:justify-start gap-2 transition-all ${
            isAnalyzing || !menuData
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white hover:opacity-90'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm sm:text-base">Analyzing...</span>
            </>
          ) : (
            <span className="text-sm sm:text-base">Analyze Menu</span>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <EnhancedProgressBar
        type="analysis"
        progress={progress}
        estimatedTime={estimatedTime}
        steps={progress?.steps || []}
      />

      {/* Error Bar for No Data */}
      {hasNoData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No analysis data was generated. This might be due to image quality or processing issues.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Retry Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Uploaded Image */}
            <div className="col-span-1">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Uploaded Menu</h4>
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
                  <img
                    src={menuData}
                    alt="Uploaded menu"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Analysis Content */}
            <div className="col-span-2 space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-6">Menu Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis?.raw?.split('##').map((section, sectionIndex) => {
                    if (!section.trim()) return null;
                    
                    const [sectionTitle, ...lines] = section.trim().split('\n');
                    
                    // Process lines to handle nested structure
                    const items = lines.reduce((acc, line, index) => {
                      const trimmedLine = line.trim();
                      if (!trimmedLine.startsWith('-')) return acc;
                      
                      const cleanLine = trimmedLine.substring(1).trim();
                      
                      // Check if this is a title line (contains **)
                      if (cleanLine.includes('**')) {
                        const title = cleanLine.match(/\*\*(.*?)\*\*/)[1].replace(':', '').trim();
                        // Look ahead for description (indented lines)
                        let description = '';
                        for (let i = index + 1; i < lines.length; i++) {
                          const nextLine = lines[i].trim();
                          if (nextLine.startsWith('-') && nextLine.includes('**')) break;
                          if (nextLine.startsWith('-')) {
                            description += nextLine.substring(1).trim() + ' ';
                          }
                        }
                        
                        acc.push({ title, description: description.trim() });
                      }
                      
                      return acc;
                    }, []);
                    
                    return (
                      <div key={sectionIndex} className="space-y-4">
                        <h5 className="font-semibold text-gray-800">{sectionTitle}</h5>
                        {items.map((item, itemIndex) => {
                          // Determine icon based on content keywords
                          let IconComponent = Layout;
                          const lowerText = (item.title + item.description).toLowerCase();
                          
                          if (lowerText.includes('brand') || lowerText.includes('color')) {
                            IconComponent = Palette;
                          } else if (lowerText.includes('price') || lowerText.includes('cost')) {
                            IconComponent = DollarSign;
                          } else if (lowerText.includes('visual') || lowerText.includes('design')) {
                            IconComponent = Eye;
                          } else if (lowerText.includes('menu') || lowerText.includes('item') || 
                                     lowerText.includes('section') || lowerText.includes('category')) {
                            IconComponent = FileText;
                          }
                          
                          return (
                            <div 
                              key={`${sectionIndex}-${itemIndex}`}
                              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                  <IconComponent className="w-4 h-4 text-orange-600" />
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-1">{item.title}</h5>
                                  <p className="text-gray-600 text-sm leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Next Step Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onNext}
              className="px-6 py-2.5 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              View Recommendations
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
} 