import { generateDesignRecommendations } from '@/utils/researchProcessor';
import { MENU_RESEARCH } from './researchProcessor';

export function generateAnalysisRecommendations(analysis) {
  try {
    const menuStructure = extractMenuStructure(analysis);
    // Use regex with optional whitespace and case insensitivity
    const sections = analysis.split(/(?:^|\n)\s*(?:STRUCTURE|DESIGN|PSYCHOLOGY|ENGINEERING|PRICING|COLOR|VISUAL ELEMENTS):/i);
    
    // Process each section with detailed extraction
    return {
      structure: processSection(sections[1]),
      design: processSection(sections[2]),
      visualElements: processSection(sections[3]),
      psychology: generatePsychologyRecommendations(sections[4], MENU_RESEARCH.psychology_factors),
      engineering: generateEngineeringRecommendations(sections[5], menuStructure),
      pricing: processSection(sections[6]),
      color: processSection(sections[7]),
      recommendations: {
        psychology: generatePsychologyRecommendations(sections[4], MENU_RESEARCH.psychology_factors),
        engineering: generateEngineeringRecommendations(sections[5], menuStructure),
        pricing: sections[6]?.trim().split('\n').filter(line => line.trim()) || [],
        design: generateDesignRecommendations('modern', {
          design: processSection(sections[2]),
          color: processSection(sections[7]),
          visualElements: processSection(sections[3])
        })
      }
    };
  } catch (error) {
    console.error('Error generating analysis recommendations:', error);
    return {
      structure: [],
      design: [],
      visualElements: [],
      psychology: [],
      engineering: [],
      pricing: [],
      color: [],
      recommendations: {
        psychology: [],
        engineering: [],
        pricing: [],
        design: []
      }
    };
  }
}

function processSection(section) {
  if (!section) return [];
  
  return section
    .trim()
    .split(/(?:\r?\n)+/)
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.match(/^[•-]\s*$/);
    })
    .map(line => {
      // Extract subsections (lines starting with - or •)
      const match = line.match(/^[•-]\s*(.+?)(?:\s*:\s*(.+))?$/);
      if (match) {
        return {
          type: 'subsection',
          title: match[1],
          description: match[2] || ''
        };
      }
      return {
        type: 'content',
        text: line.trim()
      };
    });
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