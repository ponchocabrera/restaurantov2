import { generateDesignRecommendations } from '@/utils/researchProcessor';
import { MENU_RESEARCH } from './researchProcessor';

export function generateAnalysisRecommendations(analysis) {
  try {
    // Extract key information from the analysis
    const menuStructure = extractMenuStructure(analysis);
    
    // Generate design recommendations based on the analysis
    const recommendations = generateDesignRecommendations('modern', {
      bestSellers: menuStructure.bestSellers || [],
      highMargin: menuStructure.highMargin || [],
      boostedItems: menuStructure.featured || []
    });
    
    return recommendations;
  } catch (error) {
    console.error('Error generating analysis recommendations:', error);
    return [];
  }
}

function extractMenuStructure(analysis) {
  // Basic structure extraction
  return {
    bestSellers: [],
    highMargin: [],
    featured: []
  };
}

function generateItemRecommendations(menuData) {
  const recommendations = [];
  const categories = [...new Set(menuData.items.map(item => item.category))];

  // Check category balance
  categories.forEach(category => {
    const itemsInCategory = menuData.items.filter(item => item.category === category);
    if (itemsInCategory.length > 7) {
      recommendations.push({
        type: 'category_balance',
        category,
        recommendation: `Consider reducing items in ${category} to prevent choice paralysis`
      });
    }
  });

  // Add placement recommendations for special items
  if (menuData.bestSellers?.length > 0) {
    recommendations.push({
      type: 'item_placement',
      items: menuData.bestSellers.map(item => item.name),
      recommendation: 'Place these best-sellers at the beginning or end of their sections'
    });
  }

  if (menuData.highMargin?.length > 0) {
    recommendations.push({
      type: 'visual_emphasis',
      items: menuData.highMargin.map(item => item.name),
      recommendation: 'Use visual weight (bold fonts, boxes) to highlight these high-margin items'
    });
  }

  return recommendations;
} 