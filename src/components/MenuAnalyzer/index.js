'use client';

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
    if (isAnalyzing || !menuData) return;
    
    setIsAnalyzing(true);
    
    // Update progress every 5 seconds until complete
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const currentStep = prev.analysis.step;
        return {
          analysis: {
            ...prev.analysis,
            step: currentStep < 3 ? currentStep + 1 : currentStep
          }
        };
      });
    }, 5000);

    try {
      const response = await fetch('/api/ai/analyzeMenu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'image', imageData: menuData })
      });

      clearInterval(progressInterval);

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      
      if (data.error) throw new Error(data.details || 'Analysis failed');

      setAnalysis(data.analysis);
      setProgress(prev => ({
        analysis: {
          ...prev.analysis,
          status: 'complete',
          step: 4
        }
      }));
    } catch (error) {
      clearInterval(progressInterval);
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

  const handleUploadComplete = async (data) => {
    setMenuData(data);
    setProgress(prev => ({
      analysis: {
        ...prev.analysis,
        status: 'processing',
        startTime: Date.now(),
        step: 1
      }
    }));
    
    try {
      await handleAnalyze();
      setCurrentStep(2);
    } catch (error) {
      console.error('Analysis failed:', error);
      setProgress(prev => ({
        analysis: {
          ...prev.analysis,
          status: 'error'
        }
      }));
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 2) {
      setIsAnalyzing(true);
      try {
        const recommendationsResponse = await fetch('/api/ai/generateRecommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis })
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
      <div className="min-h-screen bg-white py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl sm:text-5xl font-bold font-libre mb-2 sm:mb-4">Get AI to give you Research based upgrades to your menu</h1>
          <h2 className="text-2xl font-bold">Menu Analyzer</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-8">
            Upload your menu and get AI-powered insights and recommendations for your menu.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            
            {/* Left Sidebar - Wizard Steps */}
            <div className="lg:col-span-4 bg-[#FAFAFA] p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-4">Discover your Menu's potential</h3>
              
              {/* Step Buttons - Taller for Desktop */}
              <div className="space-y-4">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => setCurrentStep(step)}
                    className={`w-full text-left px-4 py-5 rounded-lg text-sm transition-all min-h-[80px] ${
                      currentStep === step
                        ? 'bg-[#FFFFFF] border border-[#F4AF54] text-black shadow-md'
                        : 'bg-[#E2E2E2] text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Step {step}: {getStepDescription(step)}
                  </button>
                ))}
              </div>

              {/* Tips & Best Practices */}
              <div className="mt-6">
                <h3 className="text-md font-bold font-libre mb-2">Tips & Best Practices</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  {getStepTips(currentStep).map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Side - Step Content */}
            <div className="lg:col-span-8">
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
  return {
    1: "Upload your menu for Analysis",
    2: "Review the detailed Analysis",
    3: "Get AI powered recommendations"
  }[step];
}

function getStepTips(step) {
  return {
    1: ["Use clear, high-resolution images", "Ensure all text is readable", "Include complete menu sections"],
    2: ["Review design recommendations carefully", "Consider psychological factors", "Note suggested improvements"],
    3: ["Implement high-priority recommendations", "Test changes with customers", "Track impact on sales"]
  }[step] || [];
}
