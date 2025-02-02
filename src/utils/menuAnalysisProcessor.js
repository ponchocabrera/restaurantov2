import { generateDesignRecommendations } from '@/utils/researchProcessor';
import { MENU_RESEARCH } from './researchProcessor';

export function generateAnalysisRecommendations(analysis) {
  try {
    const menuStructure = extractMenuStructure(analysis);
    const sections = analysis.split(/STRUCTURE:|DESIGN:|PSYCHOLOGY:|ENGINEERING:|PRICING:|COLOR:/);
    
    return {
      structure: sections[1]?.trim().split('\n').filter(line => line.trim()) || [],
      design: sections[2]?.trim().split('\n').filter(line => line.trim()) || [],
      recommendations: {
        psychology: generatePsychologyRecommendations(sections[3], MENU_RESEARCH.psychology_factors),
        engineering: generateEngineeringRecommendations(sections[4], menuStructure),
        pricing: sections[5]?.trim().split('\n').filter(line => line.trim()) || [],
        design: generateDesignRecommendations('modern', menuStructure)
      }
    };
  } catch (error) {
    console.error('Error generating analysis recommendations:', error);
    return {
      structure: [],
      design: [],
      recommendations: {
        psychology: [],
        engineering: [],
        pricing: [],
        design: []
      }
    };
  }
}

function extractMenuStructure(analysis) {
  try {
    // Extract categories and items from the analysis text
    const structureSection = analysis.split('STRUCTURE:')[1]?.split('DESIGN:')[0] || '';
    const categories = structureSection
      .split('\n')
      .filter(line => line.trim())
      .map(line => ({
        name: line.trim().replace(/^[•-]\s*/, ''),
        items: []
      }));

    return {
      categories,
      bestSellers: [],
      highMargin: [],
      featured: []
    };
  } catch (error) {
    console.error('Error extracting menu structure:', error);
    return {
      categories: [],
      bestSellers: [],
      highMargin: [],
      featured: []
    };
  }
}

function generateItemRecommendations(menuData) {
  const recommendations = [];
  
  // Ensure menuData has the expected structure
  if (!menuData || typeof menuData !== 'object') {
    return recommendations;
  }

  // Extract categories if they exist in the analysis
  const categories = menuData.categories || [];
  
  // Generate recommendations based on available data
  categories.forEach(category => {
    if (category.items && category.items.length > 7) {
      recommendations.push({
        type: 'category_balance',
        category: category.name,
        recommendation: `Consider reducing items in ${category.name} to prevent choice paralysis`
      });
    }
  });

  // Add placement recommendations for special items
  if (menuData.bestSellers && menuData.bestSellers.length > 0) {
    recommendations.push({
      type: 'item_placement',
      items: menuData.bestSellers,
      recommendation: 'Place these best-sellers at the beginning or end of their sections'
    });
  }

  return recommendations;
}

function generatePsychologyRecommendations(psychologySection, researchFactors) {
  const recommendations = [];
  researchFactors.forEach(factor => {
    if (factor.effectiveness > 0.7) { // Only include highly effective factors
      recommendations.push(`Implement ${factor.description} (${Math.round(factor.effectiveness * 100)}% effective)`);
    }
  });
  return recommendations;
}

function generateEngineeringRecommendations(engineeringSection, menuStructure) {
  return generateItemRecommendations({
    items: menuStructure,
    bestSellers: menuStructure.bestSellers || [],
    highMargin: menuStructure.highMargin || [],
    featured: menuStructure.featured || []
  });
} 