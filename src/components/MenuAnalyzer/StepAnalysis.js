import { useEffect } from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
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
    <section className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Menu Analysis Results</h3>
          <p className="text-sm text-gray-600 mt-1">AI-powered insights for your menu</p>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || !menuData}
          className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
            isAnalyzing || !menuData
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white hover:opacity-90'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Menu'
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
          <div className="grid grid-cols-3 gap-6">
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
              {/* Menu Structure */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Menu Structure</h4>
                <ul className="space-y-2">
                  {analysis.structure.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Design Analysis */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Design Analysis</h4>
                <ul className="space-y-2">
                  {analysis.design.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Color Analysis */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Color Analysis</h4>
                <ul className="space-y-2">
                  {analysis.color.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Visual Elements */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Visual Elements</h4>
                <ul className="space-y-2">
                  {analysis.visualElements.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Customer Psychology */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Customer Psychology</h4>
                <ul className="space-y-2">
                  {analysis.psychology.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
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