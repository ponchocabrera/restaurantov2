'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Palette, Droplet, Layout, Lightbulb, Wand2, LayoutTemplate, Code } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import EnhancedProgressBar from './shared/EnhancedProgressBar';

// [1] AIMenuGenerator: a step-based wizard with clickable steps
export default function AIMenuGenerator() {
  // Add steps definition
  const steps = [
    { id: 1, name: 'Select Your Menu' },
    { id: 2, name: 'AI Configurations' },
    { id: 3, name: 'AI Menu Recommendations' },
    { id: 4, name: 'Generate Your Menu' }
  ];

  // [2] Overall states
  const [menuItems, setMenuItems] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // [3] Wizard step
  // 1 => Select Menu, 2 => Configure AI, 3 => Generate & View Recommendations, 4 => Generate Menu & Preview
  const [currentStep, setCurrentStep] = useState(1);

  // [4] Menu config
  const [menuConfig, setMenuConfig] = useState({
    paperSize: 'letter',
    pageCount: 1,
    primaryColor: '#000000',
    secondaryColor: '#666666',
    backgroundColor: '#ffffff',
    sectionBackground: '#f8f8f8',
    style: 'modern',
    logoUrl: '',
    restaurantInfo: {
      name: '',
      address: '',
      phone: '',
      website: ''
    },
    customInstructions: ''
  });
  const [styleWanted, setStyleWanted] = useState('modern');

  // [5] AI states
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState(false);

  // [6] Progress tracking
  const [progress, setProgress] = useState({
    prompt: { 
      status: 'idle', 
      time: 0, 
      startTime: 0,
      step: 0,
      steps: ['Analyzing Menu', 'Processing Data', 'Generating Recommendations', 'Finalizing']
    },
    menu: { 
      status: 'idle', 
      time: 0, 
      startTime: 0,
      step: 0,
      steps: ['Loading Data', 'Processing Layout', 'Generating Content', 'Applying Styles']
    }
  });
  const ESTIMATED_TIMES = { prompt: 15000, menu: 30000 };

  // [7] Modals: image & fullscreen
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [showMenuModal, setShowMenuModal] = useState(false);

  // [8] On mount, load menus
  useEffect(() => {
    fetchMenus();
  }, []);

  // [9] Fetch menus
  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menus');
      if (!res.ok) throw new Error('Failed to fetch menus');
      const data = await res.json();
      setMenus(data.menus);
    } catch (err) {
      setError('Failed to load menus');
      console.error(err);
    }
  };

  // [10] Load items when we pick a menu
  useEffect(() => {
    if (!selectedMenuId) return;

    const loadMenuItems = async () => {
      try {
        const response = await fetch(`/api/menuItems?menuId=${selectedMenuId}`);
        if (!response.ok) throw new Error('Failed to fetch menu items');
        const data = await response.json();
        setMenuItems(data.items || []);
      } catch (err) {
        console.error('Error loading menu items:', err);
        setError(err.message);
      }
    };

    loadMenuItems();
  }, [selectedMenuId]);

  // [11] Step navigation
  const goNextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const goPrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  // [11A] Jump to a specific step (clicked from step indicator)
  const goToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  // [12] ProgressBar component
  const ProgressBar = ({ type, progress, estimatedTime, currentProgress }) => {
    const getProgressPercentage = () => {
      if (progress.status === 'complete') return 100;
      if (progress.status === 'generating' && currentProgress) {
        return Math.min((currentProgress.pagesGenerated / currentProgress.totalPages) * 100, 95);
      }
      if (progress.status === 'generating') {
        const elapsed = Date.now() - progress.startTime;
        return Math.min((elapsed / estimatedTime) * 100, 95);
      }
      return 0;
    };

    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">
            {type === 'prompt' ? 'Prompt Generation' : 'Menu Generation'}
          </span>
          <div className="flex gap-2 text-sm">
            {progress.status === 'generating' && currentProgress && (
              <span className="text-blue-600">
                Page {currentProgress.pagesGenerated} of {currentProgress.totalPages}
              </span>
            )}
            {progress.status === 'complete' && (
              <span className="text-green-600">
                Completed in {(progress.time / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              progress.status === 'error' ? 'bg-red-600' :
              progress.status === 'complete' ? 'bg-green-600' :
              progress.status === 'generating' ? 'bg-blue-600' :
              'bg-gray-300'
            }`}
            style={{
              width: `${getProgressPercentage()}%`,
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </div>
      </div>
    );
  };

  // Custom gradient style for circles (wizard step indicators)
  const getProgressCircleStyle = (isActive) => ({
    background: isActive 
      ? 'linear-gradient(90deg, #e4983b 0%, #f5bf66 100%)'
      : '#f3f4f6',
    boxShadow: isActive ? '0 2px 4px rgba(228, 152, 59, 0.2)' : 'none'
  });

  // [13] Step 1: menu selection
  const StepSelectMenu = () => {
    return (
      <div>
        <h3 className="text-xl font-semibold mb-6">Select your Menu</h3>
        <div className="relative">
          <select
            value={selectedMenuId || ''}
            onChange={(e) => setSelectedMenuId(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
          >
            <option value="">Choose a menu to optimize...</option>
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              if (!selectedMenuId) {
                setError('Please select a menu before continuing.');
                return;
              }
              setError('');
              goNextStep();
            }}
            className="px-6 py-3 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Next Step
          </button>
        </div>
      </div>
    );
  };

  // [14] Step 2: AI Configuration
  const StepAIConfig = () => {
    return (
      <section className="bg-white border rounded-lg p-4 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Step 2: AI Configuration</h3>

        {/* Paper Size */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Paper Size</label>
          <select
            value={menuConfig.paperSize}
            onChange={(e) => setMenuConfig({ ...menuConfig, paperSize: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="letter">Letter (8.5" × 11")</option>
            <option value="a4">A4 (210 × 297 mm)</option>
            <option value="legal">Legal (8.5" × 14")</option>
          </select>
        </div>

        {/* Page Count */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Number of Pages</label>
          <input
            type="number"
            min="1"
            max="10"
            value={menuConfig.pageCount}
            onChange={(e) => setMenuConfig({ ...menuConfig, pageCount: parseInt(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Menu Style */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Menu Style</label>
          <select
            value={styleWanted}
            onChange={(e) => setStyleWanted(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="modern">Modern &amp; Clean</option>
            <option value="classic">Classic &amp; Elegant</option>
            <option value="rustic">Rustic &amp; Warm</option>
            <option value="minimalist">Minimalist</option>
          </select>
        </div>

        {/* Colors */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Colors
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={menuConfig.primaryColor}
                  onChange={(e) => setMenuConfig({ ...menuConfig, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded border border-gray-200 cursor-pointer"
                />
                <span className="text-sm text-gray-600">{menuConfig.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={menuConfig.secondaryColor}
                  onChange={(e) => setMenuConfig({ ...menuConfig, secondaryColor: e.target.value })}
                  className="w-12 h-12 rounded border border-gray-200 cursor-pointer"
                />
                <span className="text-sm text-gray-600">{menuConfig.secondaryColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Additional Instructions</label>
          <textarea
            value={menuConfig.customInstructions}
            onChange={(e) => setMenuConfig({ ...menuConfig, customInstructions: e.target.value })}
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Any specific requirements or preferences..."
          />
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={goPrevStep}
            className="px-4 py-2 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Back
          </button>
          <button
            onClick={goNextStep}
            className="px-4 py-2 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Next
          </button>
        </div>
      </section>
    );
  };

  // [15] Step 3: Generate & View Recommendations (no duplication)
  const StepRecommendations = () => {
    // generateRecommendations from previous code
    const generateRecommendations = async () => {
      setIsLoading(true);
      setError('');
      try {
        if (!selectedMenuId) {
          throw new Error('Please select a menu first');
        }
        if (!menuItems || menuItems.length === 0) {
          throw new Error('Loading menu items... Please try again in a moment.');
        }

        const itemsAnalysis = {
          bestSellers: menuItems.filter(item => item.sales_performance === 'best_seller') || [],
          highMargin: menuItems.filter(item => item.margin_level === 'high_margin') || [],
          boostedItems: menuItems.filter(item => item.boost_desired) || []
        };

        const requestBody = {
          menuItems,
          config: {
            style: styleWanted,
            paperSize: menuConfig.paperSize,
            pageCount: menuConfig.pageCount || 1,
            primaryColor: menuConfig.primaryColor,
            secondaryColor: menuConfig.secondaryColor,
            customInstructions: menuConfig.customInstructions
          },
          itemsAnalysis
        };

        const response = await fetch('/api/ai/generatePrompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate recommendations');
        }

        const data = await response.json();
        setGeneratedPrompt(data.prompt);
        setSuggestions(data.suggestions);

        setProgress(prev => ({
          ...prev,
          prompt: {
            ...prev.prompt,
            status: 'generating',
            startTime: Date.now(),
            step: 0
          }
        }));
      } catch (err) {
        console.error('Error generating recommendations:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
        setProgress(prev => ({
          ...prev,
          prompt: {
            ...prev.prompt,
            status: 'complete',
            time: Date.now() - prev.prompt.startTime,
            step: prev.prompt.steps.length - 1
          }
        }));
      }
    };

    return (
      <section className="space-y-6">
        {/* Header with Generate Button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">AI Menu Design Plan</h3>
            <p className="text-sm text-gray-600 mt-1">Get AI-powered recommendations for your menu layout</p>
          </div>
          <button
            onClick={generateRecommendations}
            disabled={isLoading || !menuItems.length}
            className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
              isLoading || !menuItems.length
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white hover:opacity-90'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Generate Plan'
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <EnhancedProgressBar
          type="prompt"
          progress={progress.prompt}
          estimatedTime={ESTIMATED_TIMES.prompt}
          steps={progress.prompt.steps}
        />

        {/* Recommendations Display */}
        {generatedPrompt ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Design Overview */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <LayoutTemplate className="w-5 h-5 text-orange-500" />
                Design Overview
              </h4>
              <div className="prose prose-sm">
                <div className="text-gray-600 space-y-2">
                  {generatedPrompt
                    .substring(
                      generatedPrompt.indexOf('DESIGN OVERVIEW'),
                      generatedPrompt.indexOf('COLOR SCHEME')
                    )
                    .split('\n')
                    .filter(line => line.trim() && !line.includes('DESIGN OVERVIEW'))
                    .map((line, i) => (
                      <p key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2" />
                        {line.replace(/^[-*]\s*/, '')}
                      </p>
                    ))}
                </div>
              </div>
            </div>

            {/* Color Scheme */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Layout className="w-5 h-5 text-blue-500" />
                Color Scheme
              </h4>
              <div className="prose prose-sm">
                <div className="text-gray-600 space-y-2">
                  {generatedPrompt
                    .substring(
                      generatedPrompt.indexOf('COLOR SCHEME'),
                      generatedPrompt.indexOf('LAYOUT STRUCTURE')
                    )
                    .split('\n')
                    .filter(line => line.trim() && !line.includes('COLOR SCHEME'))
                    .map((line, i) => (
                      <p key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                        {line.replace(/^[-*]\s*/, '')}
                      </p>
                    ))}
                </div>
              </div>
            </div>

            {/* Layout Structure */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Palette className="w-5 h-5 text-green-500" />
                Layout Structure
              </h4>
              <div className="prose prose-sm">
                <div className="text-gray-600 space-y-2">
                  {generatedPrompt
                    .substring(
                      generatedPrompt.indexOf('LAYOUT STRUCTURE'),
                      generatedPrompt.indexOf('DESIGN RECOMMENDATIONS')
                    )
                    .split('\n')
                    .filter(line => line.trim() && !line.includes('LAYOUT STRUCTURE'))
                    .map((line, i) => (
                      <p key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2" />
                        {line.replace(/^[-*]\s*/, '')}
                      </p>
                    ))}
                </div>
              </div>
            </div>

            {/* Design Recommendations */}
            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Code className="w-5 h-5 text-purple-500" />
                Design Recommendations
              </h4>
              <div className="prose prose-sm">
                <div className="text-gray-600 space-y-2">
                  {generatedPrompt
                    .substring(generatedPrompt.indexOf('DESIGN RECOMMENDATIONS'))
                    .split('\n')
                    .filter(line => line.trim() && !line.includes('DESIGN RECOMMENDATIONS'))
                    .map((line, i) => (
                      <p key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                        {line.replace(/^\d+\.\s*/, '')}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Wand2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Click Generate to see AI recommendations</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <button
            onClick={goPrevStep}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={goNextStep}
            className="px-6 py-2.5 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Continue to Preview
          </button>
        </div>
      </section>
    );
  };

  // [16] Step 4: Generate Menu & Preview
  const StepMenuPreview = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const requestInProgress = useRef(false);
    const [generationStats, setGenerationStats] = useState({
      pagesGenerated: 0,
      totalPages: menuConfig.pageCount
    });

    const generateMenuHTML = async () => {
      if (isGenerating || requestInProgress.current) {
        return;
      }

      setIsGenerating(true);
      requestInProgress.current = true;
      const startTime = Date.now();

      try {
        if (!generatedPrompt) {
          throw new Error('Please generate a prompt first');
        }

        setGenerationStats({
          pagesGenerated: 0,
          totalPages: menuConfig.pageCount
        });

        const response = await fetch('/api/ai/generateHTML', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: generatedPrompt,
            menuItems,
            config: {
              ...menuConfig,
              style: styleWanted,
              styles: {
                primary: menuConfig.primaryColor,
                secondary: menuConfig.secondaryColor,
              },
              images: {
                'dark-wood': '/assets/textures/dark-wood.png',
                'cheese-pattern': '/assets/textures/cheese-pattern.png',
                'citrus-slices': '/assets/textures/citrus-slices.png',
                'bubbles': '/assets/textures/bubbles.png'
              }
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate menu HTML');
        }

        const data = await response.json();
        if (!data.html) {
          throw new Error('No HTML content received');
        }
        setGeneratedHTML(data.html);

      } catch (err) {
        console.error('Error generating menu:', err);
        setError(err.message);
      } finally {
        setIsGenerating(false);
        requestInProgress.current = false;
        setProgress(prev => ({
          ...prev,
          menu: { 
            status: 'complete', 
            time: Date.now() - startTime 
          }
        }));
      }
    };

    const handleDownloadPDF = async () => {
      if (!generatedHTML) {
        setError('Please generate a menu first');
        return;
      }
      try {
        const response = await fetch('/api/downloadPDF', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: generatedHTML })
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'menu.pdf';
        a.click();
      } catch (err) {
        setError('Failed to download PDF');
        console.error(err);
      }
    };

    const handlePreviewClick = (e) => {
      if (e.target.tagName === 'IMG') {
        setModalImageSrc(e.target.src);
        setShowImageModal(true);
      }
    };

    return (
      <section className="bg-white border rounded-lg p-4 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Step 4: Menu Preview</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMenuModal(true)}
              disabled={!generatedHTML}
              className="px-4 py-2 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              View Fullscreen
            </button>
            <button
              onClick={generateMenuHTML}
              disabled={isGenerating || !generatedPrompt || requestInProgress.current}
              className={`px-4 py-2 rounded-lg text-white transition-opacity ${
                isGenerating || requestInProgress.current
                  ? 'bg-gradient-to-r from-[#e4983b] to-[#f5bf66] cursor-not-allowed opacity-50'
                  : !generatedPrompt
                    ? 'bg-gradient-to-r from-[#e4983b] to-[#f5bf66] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#e4983b] to-[#f5bf66] hover:opacity-90'
              }`}
            >
              {isGenerating || requestInProgress.current ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate Menu'
              )}
            </button>
          </div>
        </div>

        <EnhancedProgressBar
          type="menu"
          progress={progress.menu}
          estimatedTime={ESTIMATED_TIMES.menu}
          steps={progress.menu.steps}
          currentProgress={generationStats}
        />

        {generatedHTML ? (
          <div 
            className="mt-4 border rounded-lg p-4 overflow-auto"
            dangerouslySetInnerHTML={{ __html: generatedHTML }}
            onClick={handlePreviewClick}
          />
        ) : (
          <div className="mt-4 text-gray-500 text-center p-8">
            Generated menu will appear here...
          </div>
        )}

        {generatedHTML && (
          <button
            onClick={handleDownloadPDF}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Download PDF
          </button>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={goPrevStep}
            className="px-4 py-2 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Back
          </button>
        </div>
      </section>
    );
  };

  // [17] Step indicator with clickable steps
  const StepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-4">
        {steps.map(({ id, name }, idx) => {
          const isActive = currentStep === id;
          return (
            <div key={id} className="flex items-center">
              <button
                onClick={() => goToStep(id)}
                className={`w-8 h-8 aspect-square rounded-full flex items-center justify-center text-white font-medium ${isActive ? '' : 'bg-gray-300 text-gray-700'}`}
                style={getProgressCircleStyle(isActive)}
              >
                {id}
              </button>
              <button
                onClick={() => goToStep(id)}
                className="ml-2 mr-4 text-sm font-medium text-gray-700"
              >
                {name}
              </button>
              {idx < steps.length - 1 && (
                <div className="border-t-2 border-gray-300 w-8 mr-4" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Utility: canProceed
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedMenuId !== null;
      case 2:
        return menuConfig.paperSize && menuConfig.pageCount > 0;
      case 3:
        return generatedPrompt !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  // NextStepButton component
  const NextStepButton = () => {
    const buttonText = currentStep === steps.length ? 'Generate Menu' : 'Next Step';
    return (
      <button
        onClick={goNextStep}
        disabled={!canProceed()}
        className={`group relative px-6 py-3 rounded-lg overflow-hidden ${!canProceed() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] transition-transform group-hover:scale-105" />
        <span className="relative text-white flex items-center gap-2">
          {buttonText}
          <svg 
            className="w-4 h-4" 
            viewBox="0 0 24 24" 
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </span>
      </button>
    );
  };

  // [18] Main return
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <a href="/" className="text-purple-600 hover:text-purple-700 flex items-center gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </a>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Generate your Menu Layout with AI
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Use AI to boost your revenue by creating the perfect Menu for your business
        </p>

        {/* Progress Steps */}
        <StepIndicator />

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Help Text (Combined into one container) */}
          <div className="col-span-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What to expect in this step
              </h3>
              <p className="text-gray-700">{getStepDescription(currentStep)}</p>
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
                Tips & Best Practices
              </h3>
              <ul className="list-disc list-inside text-gray-700">
                {getStepTips(currentStep).map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Main Content */}
          <div className="col-span-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              {currentStep === 1 && <StepSelectMenu />}
              {currentStep === 2 && <StepAIConfig />}
              {currentStep === 3 && <StepRecommendations />}
              {currentStep === 4 && <StepMenuPreview />}
            </div>
          </div>
        </div>
      </div>

      {/* [22] Image Modal (for individual images) */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg max-w-3xl max-h-[80vh] overflow-auto">
            <img src={modalImageSrc} alt="Preview" className="w-full h-auto" />
            <button
              className="mt-4 px-4 py-2 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white rounded-lg hover:opacity-90 transition-opacity"
              onClick={() => setShowImageModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* [23] Fullscreen Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setShowMenuModal(false)}
              className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-[#e4983b] to-[#f5bf66] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Close
            </button>
            <div dangerouslySetInnerHTML={{ __html: generatedHTML }} />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for the right column content
function getStepDescription(step) {
  const descriptions = {
    1: "Select the menu you want to optimize. We'll analyze its current structure and performance metrics.",
    2: "Configure AI parameters to match your brand style and design preferences.",
    3: "Review AI-generated recommendations for layout, colors, and item placement.",
    4: "Generate your final menu layout with optimized design and structure."
  };
  return descriptions[step];
}

function getStepTips(step) {
  const tips = {
    1: [
      "Choose a menu with complete item information",
      "Ensure prices are up to date",
      "Include all categories you want to feature"
    ],
    2: [
      "Select colors that match your brand",
      "Consider your target audience when choosing style",
      "Think about the atmosphere of your restaurant"
    ],
    3: [
      "Pay attention to item placement suggestions",
      "Review color scheme recommendations",
      "Consider the psychological factors mentioned"
    ],
    4: [
      "Double-check all menu items are included",
      "Verify pricing accuracy",
      "Review the visual hierarchy of items"
    ]
  };
  return tips[step];
}
