import { generateDesignRecommendations } from '@/utils/researchProcessor';
import { MENU_RESEARCH } from './researchProcessor';

function processSection(sectionText) {
  if (!sectionText) return [];
  return sectionText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    // Deduplicate in a case-insensitive manner
    .filter((item, index, self) => self.findIndex(x => x.toLowerCase() === item.toLowerCase()) === index);
}

export function generateAnalysisRecommendations(analysis) {
  try {
    if (!analysis || !analysis.raw) return {};
    
    const sections = {};
    const uniqueItems = new Set();
    
    // Split the raw text into sections
    const rawSections = analysis.raw.split(/(?=\b(?:STRUCTURE|DESIGN|PSYCHOLOGY|ENGINEERING|PRICING|COLOR|VISUAL ELEMENTS|CUSTOMER EXPERIENCE):)/i);
    
    rawSections.forEach(section => {
      const match = section.match(/^(STRUCTURE|DESIGN|PSYCHOLOGY|ENGINEERING|PRICING|COLOR|VISUAL ELEMENTS|CUSTOMER EXPERIENCE):([\s\S]*)/i);
      if (match) {
        const [, sectionName, content] = match;
        const key = sectionName.toLowerCase().replace(/\s+/g, '');
        
        const items = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && (line.startsWith('-') || line.startsWith('•')))
          .map(line => line.substring(1).trim());
        
        sections[key] = items.filter(item => {
          const lowerItem = item.toLowerCase();
          if (uniqueItems.has(lowerItem)) return false;
          uniqueItems.add(lowerItem);
          return true;
        });
      }
    });
    
    return sections;
  } catch (error) {
    console.error('Error generating analysis recommendations:', error);
    return {};
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