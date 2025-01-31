'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  BookOpen, 
  Download, 
  RefreshCw, 
  Send, 
  Edit3,
  AlertCircle
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function AIMenuGenerator() {
  // State management
  const [menuItems, setMenuItems] = useState([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Menu configuration
  const [menuConfig, setMenuConfig] = useState({
    paperSize: 'letter',
    pageCount: 1,
    primaryColor: '#000000',
    secondaryColor: '#666666',
    inspirationURL: '',
    customInstructions: ''
  });

  // Add separate style state
  const [styleWanted, setStyleWanted] = useState('modern');

  // Add selectedMenuId state
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [menus, setMenus] = useState([]);

  // Add new state for progress tracking
  const [progress, setProgress] = useState({
    prompt: { status: 'idle', time: 0, startTime: 0 },
    menu: { status: 'idle', time: 0, startTime: 0 }
  });

  // Add new state for suggestions
  const [suggestions, setSuggestions] = useState(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState(false);

  // Add at the top of the component, after the useState declarations (around line 52)
  const ESTIMATED_TIMES = {
    prompt: 15000,  // 15 seconds for prompt generation
    menu: 30000     // 30 seconds for menu generation
  };

  // Load menu items on mount
  useEffect(() => {
    fetchMenus();
  }, []);

  // Fetch menus from database
  const fetchMenus = async () => {
    try {
      const response = await fetch('/api/menus');
      if (!response.ok) throw new Error('Failed to fetch menus');
      const data = await response.json();
      setMenus(data.menus);
    } catch (err) {
      setError('Failed to load menus');
      console.error(err);
    }
  };

  // Add useEffect for loading menu items when menu is selected
  useEffect(() => {
    const loadMenuItems = async () => {
      if (!selectedMenuId) return;
      
      try {
        const response = await fetch(`/api/menuItems?menuId=${selectedMenuId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch menu items');
        }
        const data = await response.json();
        setMenuItems(data.items || []);
      } catch (err) {
        console.error('Error loading menu items:', err);
        setError(err.message);
      }
    };

    loadMenuItems();
  }, [selectedMenuId]);

  // Fetch menu items from database
  const fetchMenuItems = async () => {
    try {
      if (!selectedMenuId) {
        return; // Just return without setting error
      }

      const response = await fetch(`/api/menuItems?menuId=${selectedMenuId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data || !data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format from server');
      }
      
      setMenuItems(data.items.map(item => ({
        id: item.id,
        name: item.name || '',
        description: item.description || '',
        price: item.price || 0,
        category: item.category || '',
        sales_performance: item.sales_performance || '',
        margin_level: item.margin_level || '',
        boost_desired: item.boost_desired || false
      })));
      setError(''); // Clear error on successful fetch
    } catch (err) {
      setError(`Failed to load menu items: ${err.message}`);
      console.error('Error fetching menu items:', err);
      setMenuItems([]);
    }
  };

  // Add this function after the state declarations
  const handleMenuSelect = async (menuId) => {
    setSelectedMenuId(menuId);
    setMenuItems([]); // Clear existing items
    
    if (!menuId) return;
    
    try {
      // Fetch menu items for the selected menu
      const response = await fetch(`/api/menus/${menuId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      setMenuItems(data.items);
    } catch (err) {
      console.error('Error loading menu items:', err);
      setError(err.message);
    }
  };

  // Modify the generateInitialPrompt function
  const generateInitialPrompt = async () => {
    const startTime = Date.now();
    setProgress(prev => ({
      ...prev,
      prompt: { status: 'generating', time: 0, startTime }
    }));
    
    try {
      if (!selectedMenuId) {
        throw new Error('Please select a menu first');
      }

      // Add a check for items loading
      if (!menuItems || menuItems.length === 0) {
        throw new Error('Loading menu items... Please try again in a moment.');
      }

      console.log('Processing menu items...');
      const itemsAnalysis = {
        bestSellers: menuItems.filter(item => item.sales_performance === 'best_seller') || [],
        highMargin: menuItems.filter(item => item.margin_level === 'high_margin') || [],
        boostedItems: menuItems.filter(item => item.boost_desired) || []
      };

      const requestBody = {
        menuItems,
        config: { style: styleWanted },
        itemsAnalysis
      };

      console.log('Sending request to API...', requestBody);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/ai/generatePrompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions);
      setGeneratedPrompt(data.prompt);
      
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setProgress(prev => ({
        ...prev,
        prompt: { status: 'complete', time: Date.now() - startTime }
      }));
    }
  };

  // Add suggestion acceptance handler
  const handleAcceptSuggestions = () => {
    if (!suggestions) return;
    
    setMenuConfig(prev => ({
      ...prev,
      pageCount: suggestions.pageCount,
      primaryColor: suggestions.primaryColor,
      secondaryColor: suggestions.secondaryColor
    }));
    setAcceptedSuggestions(true);
  };

  // Generate HTML using Claude AI
  const generateMenuHTML = async () => {
    console.log('Starting menu HTML generation...');
    const startTime = Date.now();
    setProgress(prev => ({
      ...prev,
      menu: { status: 'generating', time: 0, startTime }
    }));
    
    try {
      if (!generatedPrompt) {
        throw new Error('Please generate a prompt first');
      }

      console.log('Sending request to generate HTML...');
      const response = await fetch('/api/ai/generateHTML', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: generatedPrompt,
          menuItems,
          config: menuConfig
        }),
      });
      
      console.log('Received response:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate menu HTML');
      }
      
      const data = await response.json();
      console.log('Generated HTML successfully');
      setGeneratedHTML(data.html);
    } catch (err) {
      console.error('Error generating menu:', err);
      setError(err.message);
    } finally {
      setProgress(prev => ({
        ...prev,
        menu: { status: 'complete', time: Date.now() - startTime }
      }));
    }
  };

  // Download as PDF
  const downloadPDF = async () => {
    try {
      const response = await fetch('/api/downloadPDF', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: generatedHTML
        }),
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

  // Add progress bar component to the JSX
  const ProgressBar = ({ type, progress, estimatedTime }) => {
    const getProgressPercentage = () => {
      if (progress.status === 'complete') return 100;
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
            {progress.status === 'generating' && (
              <span className="text-blue-600">
                {Math.round((Date.now() - progress.startTime) / 1000)}s / {estimatedTime / 1000}s
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

  // Add these button handlers
  const handleGeneratePrompt = async () => {
    setIsLoading(true);
    setError('');
    try {
      await generateInitialPrompt();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMenu = async () => {
    const startTime = Date.now();
    setProgress(prev => ({
      ...prev,
      menu: { status: 'generating', time: 0, startTime }
    }));
    
    try {
      if (!generatedPrompt) {
        throw new Error('Please generate a prompt first');
      }

      const response = await fetch('/api/ai/generateHTML', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: generatedPrompt,
          menuItems,
          config: {
            ...menuConfig,
            style: styleWanted,
            styles: {
              primary: menuConfig.primaryColor,
              secondary: menuConfig.secondaryColor,
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate menu HTML');
      }
      
      const data = await response.json();
      // Inject styles directly into HTML to avoid external CSS dependency
      const htmlWithStyles = `
        <style>
          .menu-container {
            font-family: 'Arial', sans-serif;
            max-width: ${menuConfig.paperSize === 'letter' ? '8.5in' : '210mm'};
            margin: 0 auto;
            padding: 2rem;
            color: ${menuConfig.primaryColor};
          }
          .menu-item {
            margin-bottom: 1rem;
            padding: 0.5rem;
            border-bottom: 1px solid ${menuConfig.secondaryColor};
          }
          /* Add more styles as needed */
        </style>
        ${data.html}
      `;
      
      setGeneratedHTML(htmlWithStyles);
    } catch (err) {
      console.error('Error generating menu:', err);
      setError(err.message);
    } finally {
      setProgress(prev => ({
        ...prev,
        menu: { status: 'complete', time: Date.now() - startTime }
      }));
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedHTML) {
      setError('Please generate a menu first');
      return;
    }
    // PDF download logic here
  };

  // Generate recommendations using OpenAI
  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
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
          pageCount: menuConfig.pageCount
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
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Menu Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Menu</h2>
        <select 
          value={selectedMenuId || ''}
          onChange={(e) => handleMenuSelect(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Choose a menu...</option>
          {menus.map((menu) => (
            <option key={menu.id} value={menu.id}>
              {menu.name}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Menu Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Paper Size */}
          <div>
            <label className="block text-sm font-medium mb-1">Paper Size</label>
            <select 
              value={menuConfig.paperSize}
              onChange={(e) => setMenuConfig({...menuConfig, paperSize: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="letter">Letter (8.5" × 11")</option>
              <option value="a4">A4 (210 × 297 mm)</option>
              <option value="legal">Legal (8.5" × 14")</option>
            </select>
          </div>

          {/* Page Count */}
          <div>
            <label className="block text-sm font-medium mb-1">Number of Pages</label>
            <input 
              type="number"
              min="1"
              max="10"
              value={menuConfig.pageCount}
              onChange={(e) => setMenuConfig({...menuConfig, pageCount: parseInt(e.target.value)})}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium mb-1">Menu Style</label>
            <select 
              value={styleWanted}
              onChange={(e) => setStyleWanted(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="modern">Modern & Clean</option>
              <option value="classic">Classic & Elegant</option>
              <option value="rustic">Rustic & Warm</option>
              <option value="minimalist">Minimalist</option>
            </select>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium mb-1">Primary Color</label>
            <input 
              type="color"
              value={menuConfig.primaryColor}
              onChange={(e) => setMenuConfig({...menuConfig, primaryColor: e.target.value})}
              className="w-full p-1 border rounded"
            />
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Additional Instructions</label>
          <textarea
            value={menuConfig.customInstructions}
            onChange={(e) => setMenuConfig({...menuConfig, customInstructions: e.target.value})}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Any specific requirements or preferences..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleGenerateMenu}
          disabled={isLoading || !generatedPrompt}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Generate Menu
        </button>
        
        <button
          onClick={handleDownloadPDF}
          disabled={isLoading || !generatedHTML}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Download PDF
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generated Content Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Recommendations Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">AI Recommendations</h3>
            <button
              onClick={generateRecommendations}
              disabled={isLoading || !menuItems.length}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Generate Recommendation
            </button>
          </div>
          <div className="prose max-w-none whitespace-pre-wrap">
            {generatedPrompt ? (
              <div className="space-y-4">
                <section>
                  <h4 className="font-bold">DESIGN OVERVIEW</h4>
                  <p>{generatedPrompt.match(/DESIGN OVERVIEW(.*?)(?=COLOR SCHEME)/s)?.[1]?.trim()}</p>
                </section>
                
                <section>
                  <h4 className="font-bold">COLOR SCHEME</h4>
                  <p>{generatedPrompt.match(/COLOR SCHEME(.*?)(?=LAYOUT STRUCTURE)/s)?.[1]?.trim()}</p>
                </section>
                
                <section>
                  <h4 className="font-bold">LAYOUT STRUCTURE</h4>
                  <p>{generatedPrompt.match(/LAYOUT STRUCTURE(.*?)(?=DESIGN RECOMMENDATIONS)/s)?.[1]?.trim()}</p>
                </section>
                
                <section>
                  <h4 className="font-bold">DESIGN RECOMMENDATIONS</h4>
                  <p>{generatedPrompt.match(/DESIGN RECOMMENDATIONS(.*?)$/s)?.[1]?.trim()}</p>
                </section>
              </div>
            ) : (
              <p className="text-gray-500">AI recommendations will appear here...</p>
            )}
          </div>
        </div>

        {/* Menu Preview Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Menu Preview</h3>
            <button
              onClick={handleGenerateMenu}
              disabled={isLoading || !generatedPrompt}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Generate Menu
            </button>
          </div>
          <div className="menu-preview-container overflow-auto max-h-[800px] print:max-h-none">
            {generatedHTML ? (
              <div dangerouslySetInnerHTML={{ __html: generatedHTML }} />
            ) : (
              <p className="text-gray-500">Preview will appear here...</p>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleDownloadPDF}
              disabled={isLoading || !generatedHTML}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Generation Progress</h2>
        <ProgressBar 
          type="prompt" 
          progress={progress.prompt} 
          estimatedTime={ESTIMATED_TIMES.prompt}
        />
        <ProgressBar 
          type="menu" 
          progress={progress.menu} 
          estimatedTime={ESTIMATED_TIMES.menu}
        />
      </div>

      {/* AI Suggestions Display */}
      {suggestions && !acceptedSuggestions && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">AI Design Recommendations</h2>
          <div className="prose max-w-none whitespace-pre-wrap">
            {suggestions.content}
          </div>
          <div className="mt-4">
            <button
              onClick={handleAcceptSuggestions}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Accept Recommendations
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Select Menu</label>
        <select 
          value={selectedMenuId || ''} 
          onChange={(e) => handleMenuSelect(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select a menu</option>
          {menus.map((menu) => (
            <option key={menu.id} value={menu.id}>
              {menu.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}