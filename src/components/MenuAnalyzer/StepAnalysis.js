'use client';

import { useState } from 'react';
import { RefreshCw, ArrowRight, Layout, Palette, DollarSign, Eye, FileText, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
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

  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const handleRetry = () => {
    onAnalyze();
  };

  return (
    <section className="space-y-6">
      {/* Header Section */}
      <div>
        <h3 className="text-2xl font-bold text-black">Menu Analysis Results</h3>
        <p className="text-sm text-gray-600">AI-powered insights for your menu backed by Scientific Research</p>
      </div>

      {/* Image + Explanation Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Uploaded Menu Image - Small Thumbnail */}
        <div className="relative bg-gray-100 rounded-lg p-4 w-24 h-24 flex items-center justify-center">
          <img
            src={menuData}
            alt="Uploaded menu"
            className="w-full h-full object-cover rounded-lg cursor-pointer"
            onClick={() => setIsImageExpanded(true)}
          />
          <button 
            onClick={() => setIsImageExpanded(true)} 
            className="absolute bottom-2 right-2 bg-black bg-opacity-50 p-1 rounded text-white"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Image Expand Modal */}
        {isImageExpanded && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="relative bg-white p-4 rounded-lg max-w-4xl w-full">
              <button 
                onClick={() => setIsImageExpanded(false)} 
                className="absolute top-2 right-2 bg-black bg-opacity-50 p-1 rounded text-white"
              >
                ✕
              </button>
              <img src={menuData} alt="Uploaded menu expanded" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        )}

        {/* Explanation Dropdown */}
        <div className="w-full">
          <button
            onClick={() => setIsExplanationOpen(!isExplanationOpen)}
            className="w-full flex justify-between items-center px-4 py-3 bg-[#212350] text-white font-bold rounded-lg shadow-lg"
          >
            How does your Menu get Analyzed?
            {isExplanationOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {isExplanationOpen && (
            <div className="mt-2 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">
                Our AI analyzes your menu using a multi-step process, evaluating design, structure, layout, and
                readability. Insights are generated based on scientific research and industry best practices.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <EnhancedProgressBar
        type="analysis"
        progress={progress}
        estimatedTime={estimatedTime}
        steps={progress?.steps || []}
      />

      {/* Analyze Menu Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || !menuData}
          className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#212350] text-white font-bold transition-all hover:bg-opacity-90 disabled:bg-gray-200 disabled:text-gray-500 flex justify-center items-center"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </div>
          ) : (
            'Analyze Menu'
          )}
        </button>
      </div>

      {/* Analysis Results */}
      <div>
        {analysis?.raw?.split('##').map((section, sectionIndex) => {
          if (!section.trim()) return null;
          
          const [sectionTitle, ...lines] = section.trim().split('\n');
          const items = lines.reduce((acc, line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith('-')) return acc;
            const cleanLine = trimmedLine.substring(1).trim();
            if (cleanLine.includes('**')) {
              const title = cleanLine.match(/\*\*(.*?)\*\*/)[1].replace(':', '').trim();
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
              {items.map((item, itemIndex) => {
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
                  <div key={`${sectionIndex}-${itemIndex}`} className="bg-gray-100 rounded-lg p-6 shadow-md flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-gray-800" />
                    </div>
                    <div>
                      <h5 className="font-bold text-lg text-black">{item.title}</h5>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Apply Analysis Button */}
      {analysis && (
        <div className="flex justify-end mt-4">
          <button
            onClick={onNext}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
          >
            Apply Analysis
          </button>
        </div>
      )}

      {/* Next Step Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={onNext}
          className="px-6 py-3 bg-[#212350] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          View Recommendations
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}


