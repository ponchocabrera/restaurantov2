'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import StepUpload from './StepUpload';
import StepAnalysis from './StepAnalysis';
import StepRecommendations from './StepRecommendations';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

export default function MenuAnalyzer() {
  const { language } = useLanguage();
  // t collects all menuAnalyzer translations from the JSON files.
  const t = language === 'es' ? es.menuAnalyzer : en.menuAnalyzer;
  // Extra keys that might not be included yet in your JSON files. You can also add these into your locale files.
  const stepLabel = t.stepLabel || (language === 'es' ? 'Paso' : 'Step');
  const tipsBestPracticesLabel = t.tipsBestPractices || (language === 'es' ? 'Consejos y mejores prácticas' : 'Tips & Best Practices');

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
        body: JSON.stringify({
          type: 'image',
          imageData: menuData,
          language
        })
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

  const processRecommendations = (recs) => {
    const seen = new Set();
    return Object.entries(recs).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        acc[key] = value.filter(rec => {
          const recKey = typeof rec === 'object' ? 
            rec.recommendation?.toLowerCase().trim() : 
            rec.toLowerCase().trim();
          if (!recKey || seen.has(recKey)) return false;
          seen.add(recKey);
          return true;
        });
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
  };

  const handleNextStep = async () => {
    if (currentStep === 2 && !recommendations) {
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

        const processedRecs = processRecommendations(data.recommendations);
        setRecommendations(processedRecs);
        setCurrentStep(3);
      } catch (error) {
        console.error('Recommendations failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl sm:text-5xl font-bold font-libre mb-2 sm:mb-4">
            {t.mainTitle}
          </h1>
          <h2 className="text-2xl font-bold">{t.title}</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-8">
            {t.description}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            
            {/* Left Sidebar - Wizard Steps */}
            <div className="lg:col-span-4 bg-[#FAFAFA] p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-4">{t.sidebarTitle}</h3>
              
              {/* Step Buttons - Taller for Desktop */}
              <div className="space-y-4">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => setCurrentStep(step)}
                    className={`w-full text-left px-4 py-5 rounded-lg text-sm transition-all min-h-[80px] ${
                      currentStep === step
                        ? 'bg-[#FFFFFF] border border-[#222452] text-black shadow-md'
                        : 'bg-[#E2E2E2] text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Icon Placeholder for each step with larger size */}
                      <img
                        src={`/assets/icons/step${step}.png`}
                        alt={`${stepLabel} ${step} icon placeholder`}
                        className="w-8 h-8"
                      />
                      <span>
                        {stepLabel} {step}: {getStepDescription(step, language)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Tips & Best Practices */}
              <div className="mt-6">
                <h3 className="text-md font-bold font-libre mb-2">{tipsBestPracticesLabel}</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  {getStepTips(currentStep, language).map((tip, index) => (
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

function getStepDescription(step, language) {
  const translations = {
    1: {
      en: "Upload your menu for Analysis",
      es: "Sube tu menú para el análisis"
    },
    2: {
      en: "Review the detailed Analysis",
      es: "Revisa el análisis detallado"
    },
    3: {
      en: "Get AI powered recommendations",
      es: "Obtén recomendaciones impulsadas por IA"
    }
  };
  return translations[step] ? translations[step][language] : "";
}

function getStepTips(step, language) {
  const translations = {
    1: {
      en: ["Use clear, high-resolution images", "Ensure all text is readable", "Include complete menu sections"],
      es: ["Usa imágenes claras y de alta resolución", "Asegúrate de que el texto sea legible", "Incluye todas las secciones del menú"]
    },
    2: {
      en: ["Review design recommendations carefully", "Consider psychological factors", "Note suggested improvements"],
      es: ["Revisa cuidadosamente las recomendaciones de diseño", "Considera factores psicológicos", "Toma nota de las mejoras sugeridas"]
    },
    3: {
      en: ["Implement high-priority recommendations", "Test changes with customers", "Track impact on sales"],
      es: ["Implementa las recomendaciones de alta prioridad", "Prueba los cambios con los clientes", "Mide el impacto en las ventas"]
    }
  };
  return translations[step] ? translations[step][language] : [];
}
