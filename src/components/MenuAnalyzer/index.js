import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import StepUpload from './StepUpload';
import StepAnalysis from './StepAnalysis';
import StepRecommendations from './StepRecommendations';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function MenuAnalyzer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [menuData, setMenuData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [progress, setProgress] = useState({
    analysis: { 
      status: 'idle', 
      time: 0, 
      startTime: 0,
      step: 0,
      steps: ['Processing Input', 'Analyzing Design', 'Generating Insights', 'Finalizing']
    }
  });
  
  const ESTIMATED_TIMES = { analysis: 20000 };

  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setProgress(prev => ({
      analysis: {
        ...prev.analysis,
        status: 'processing',
        startTime: Date.now(),
        step: 1
      }
    }));

    try {
      const imageData = menuData.startsWith('data:') 
        ? menuData 
        : `data:image/jpeg;base64,${menuData}`;

      const response = await fetch('/api/ai/analyzeMenu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'image', imageData })
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      
      if (data.error) throw new Error(data.details || 'Analysis failed');

      // Parse the raw analysis text into sections
      const rawText = data.analysis;
      
      // Set analysis state with all sections
      const analysisResult = {
        raw: rawText,
        structure: extractSection(rawText, 'STRUCTURE'),
        design: extractSection(rawText, 'DESIGN'),
        pricing: extractSection(rawText, 'PRICING'),
        color: extractSection(rawText, 'COLOR'),
        visualElements: extractSection(rawText, 'VISUAL ELEMENTS'),
        psychology: extractSection(rawText, 'CUSTOMER PSYCHOLOGY')
      };
      
      console.log('Parsed analysis:', analysisResult);
      setAnalysis(analysisResult);
      setCurrentStep(2);

      setProgress(prev => ({
        analysis: {
          ...prev.analysis,
          status: 'complete',
          step: 4
        }
      }));
    } catch (error) {
      console.error('Analysis failed:', error);
      setProgress(prev => ({
        analysis: {
          ...prev.analysis,
          status: 'error'
        }
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to extract sections from the analysis text
  const extractSection = (text, sectionName) => {
    const sectionRegex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n\\n|$)`);
    const match = text.match(sectionRegex);
    if (!match) return [];
    
    return match[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.includes(`${sectionName}:`))
      .map(line => line.replace(/^[-•*]\s*/, ''));
  };

  const handleUploadComplete = (data) => {
    setMenuData(data);
    setCurrentStep(2);
  };

  const handleNextStep = async () => {
    if (currentStep === 2) {
      setIsAnalyzing(true);
      try {
        const recommendationsResponse = await fetch('/api/ai/generateRecommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis: analysis.raw })
        });

        if (!recommendationsResponse.ok) throw new Error('Recommendations failed');
        const data = await recommendationsResponse.json();
        
        if (data.error) throw new Error(data.details || 'Recommendations failed');

        setRecommendations(data.recommendations);
        setCurrentStep(3);
      } catch (error) {
        console.error('Recommendations failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-semibold mb-4">Menu Analyzer</h1>
          <p className="text-gray-600 mb-8">Get AI-powered insights and recommendations for your menu.</p>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Steps</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((step) => (
                    <button
                      key={step}
                      onClick={() => setCurrentStep(step)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        currentStep === step
                          ? 'bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Step {step}: {getStepDescription(step)}
                    </button>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Tips & Best Practices
                  </h3>
                  <ul className="list-disc list-inside text-gray-700">
                    {getStepTips(currentStep).map((tip, index) => (
                      <li key={index} className="mb-2">{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-span-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                {currentStep === 1 && (
                  <StepUpload 
                    onUploadComplete={handleUploadComplete}
                    onStepComplete={() => setCurrentStep(2)} 
                  />
                )}
                {currentStep === 2 && (
                  <StepAnalysis 
                    menuData={menuData}
                    analysis={analysis}
                    isAnalyzing={isAnalyzing}
                    progress={progress.analysis}
                    estimatedTime={ESTIMATED_TIMES.analysis}
                    onAnalyze={handleAnalyze}
                    onNext={handleNextStep}
                  />
                )}
                {currentStep === 3 && (
                  <StepRecommendations 
                    analysis={analysis}
                    recommendations={recommendations}
                    isLoading={isAnalyzing}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function getStepDescription(step) {
  const stepDescriptions = {
    1: "Upload your menu (image or text) for AI analysis",
    2: "Review the detailed analysis of your menu",
    3: "Get AI-powered recommendations for improvement"
  };
  return stepDescriptions[step];
}

function getStepTips(step) {
  const tips = {
    1: [
      "Use clear, high-resolution menu images",
      "Ensure all text is readable",
      "Include complete menu sections"
    ],
    2: [
      "Review design recommendations carefully",
      "Consider psychological factors highlighted",
      "Note suggested improvements for implementation"
    ],
    3: [
      "Implement high-priority recommendations first",
      "Test changes with sample customers",
      "Track impact on sales after changes"
    ]
  };
  return tips[step] || [];
}