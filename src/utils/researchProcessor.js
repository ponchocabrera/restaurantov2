// utils/researchProcessor.js

const MENU_RESEARCH = {
    pricing_strategies: [
      {
        type: 'price_anchoring',
        description: 'Place high-margin items prominently to make other items appear more reasonable',
        impact_score: 0.8
      },
      {
        type: 'decimal_pricing',
        description: 'Use .95 instead of .99 for upscale restaurants',
        impact_score: 0.6
      },
      {
        type: 'menu_position',
        description: 'Place high-margin items in the top-right corner where eyes naturally land',
        impact_score: 0.9
      },
      {
        type: 'premium_positioning',
        description: 'Position premium items first in each category to set price anchors',
        impact_score: 0.85
      },
      {
        type: 'price_presentation',
        description: 'Remove dollar signs and use clean numerals to reduce price anxiety',
        impact_score: 0.75
      }
    ],
    design_principles: [
      {
        principle: 'white_space',
        description: 'Use adequate spacing to prevent menu fatigue',
        importance: 'high'
      },
      {
        principle: 'item_clustering',
        description: 'Group similar items together, max 7 items per category',
        importance: 'high'
      },
      {
        principle: 'visual_hierarchy',
        description: 'Use size and weight contrast to guide attention',
        importance: 'medium'
      },
      {
        principle: 'golden_triangle',
        description: 'Place high-profit items in the top-right area where eyes naturally land first',
        importance: 'high'
      },
      {
        principle: 'category_organization',
        description: 'Organize items by category with clear visual hierarchy',
        importance: 'high'
      }
    ],
    psychology_factors: [
      {
        factor: 'decoy_effect',
        description: 'Include premium items to make target items more attractive',
        effectiveness: 0.85
      },
      {
        factor: 'choice_paradox',
        description: 'Limit options to prevent decision paralysis',
        effectiveness: 0.75
      },
      {
        factor: 'scarcity_effect',
        description: 'Mark certain items as "Limited Availability" to increase desirability',
        effectiveness: 0.80
      },
      {
        factor: 'social_proof',
        description: 'Highlight "Chef\'s Recommendations" and "Customer Favorites"',
        effectiveness: 0.85
      }
    ],
    layout_guidelines: [
      {
        guideline: 'section_balance',
        description: 'Balance menu sections with 5-7 items each to prevent choice paralysis',
        priority: 'high'
      },
      {
        guideline: 'visual_weight',
        description: 'Use bold fonts and boxes to draw attention to high-margin items',
        priority: 'medium'
      }
    ]
  };
  
  function processMenuItems(items) {
    return {
      bestSellers: items.filter(item => item.sales_performance === 'best_seller'),
      highMargin: items.filter(item => item.margin_level === 'high_margin'),
      boostedItems: items.filter(item => item.boost_desired),
      categories: [...new Set(items.map(item => item.category))].filter(Boolean)
    };
  }
  
  function generateDesignRecommendations(menuStyle, analysis = {}) {
    const recommendations = [];
    
    // Extract insights from analysis
    const designSection = analysis?.design || [];
    const colorSection = analysis?.color || [];
    const visualElements = analysis?.visualElements || [];

    // Generate dynamic recommendations based on actual analysis
    designSection.forEach(item => {
      if (typeof item === 'string') {
        const lowercased = item.toLowerCase();
        
        // Typography recommendations
        if (lowercased.includes('font') || lowercased.includes('typography')) {
          recommendations.push({
            recommendation: 'Optimize Typography',
            reasoning: item,
            impact: 'Improved readability and brand consistency',
            priority: 'high'
          });
        }
        
        // Layout recommendations
        if (lowercased.includes('layout') || lowercased.includes('spacing')) {
          recommendations.push({
            recommendation: 'Enhance Layout Structure',
            reasoning: item,
            impact: 'Better information hierarchy and flow',
            priority: 'medium'
          });
        }
      }
    });

    // Color-based recommendations
    colorSection.forEach(item => {
      if (typeof item === 'string' && item.toLowerCase().includes('contrast')) {
        recommendations.push({
          recommendation: 'Improve Color Contrast',
          reasoning: item,
          impact: 'Enhanced readability and visual appeal',
          priority: 'high'
        });
      }
    });

    // Visual elements recommendations
    visualElements.forEach(item => {
      if (typeof item === 'string') {
        if (item.toLowerCase().includes('image')) {
          recommendations.push({
            recommendation: 'Optimize Image Usage',
            reasoning: item,
            impact: 'Better visual engagement',
            priority: 'medium'
          });
        }
      }
    });

    // If no specific recommendations were generated, add fallback recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        recommendation: 'Use clean, readable typography',
        reasoning: 'Clear typography ensures menu readability',
        impact: 'Improved customer experience',
        priority: 'high'
      });
    }

    return recommendations;
  }
  
  function constructPrompt(menuItems, config, itemsAnalysis) {
    const { style, paperSize, pageCount } = config;
    const designRecs = generateDesignRecommendations(style, itemsAnalysis);
    
    return `
  Create a ${style} restaurant menu design with the following specifications:
  
  Format:
  - Paper size: ${paperSize}
  - Number of pages: ${pageCount}
  - Style: ${style}
  
  Menu Psychology Implementation:
  ${MENU_RESEARCH.psychology_factors
    .map(f => `- ${f.description} (${Math.round(f.effectiveness * 100)}% effective)`)
    .join('\n')}
  
  Design Recommendations:
  ${designRecs.map(rec => `- ${rec.recommendation} (${rec.reasoning})`).join('\n')}
  
  Key Items to Highlight:
  - Best Sellers: ${itemsAnalysis.bestSellers.map(item => item.name).join(', ')}
  - High Margin Items: ${itemsAnalysis.highMargin.map(item => item.name).join(', ')}
  - Items to Boost: ${itemsAnalysis.boostedItems.map(item => item.name).join(', ')}
  
  Please create an HTML structure that:
  1. Implements these research-backed design principles
  2. Optimizes item placement based on psychological factors
  3. Creates a visually appealing and balanced layout
  4. Ensures printability and professional appearance`;
  }
  
  module.exports = {
    processMenuItems,
    generateDesignRecommendations,
    constructPrompt,
    MENU_RESEARCH
  };