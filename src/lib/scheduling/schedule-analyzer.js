import { OpenAI } from 'openai';

/**
 * Calculate basic metrics for a generated schedule.
 */
function calculateMetrics(scheduleData) {
  if (!scheduleData || !Array.isArray(scheduleData.schedule)) {
    return {
      totalShifts: 0,
      shiftsPerRole: {},
      shiftsPerZone: {},
      warnings: [],
      staffingGaps: {}
    };
  }

  const metrics = {
    totalShifts: scheduleData.schedule.length,
    shiftsPerRole: {},
    shiftsPerZone: {},
    warnings: [],
    staffingGaps: {}
  };

  scheduleData.schedule.forEach(shift => {
    metrics.shiftsPerRole[shift.role] = (metrics.shiftsPerRole[shift.role] || 0) + 1;
    metrics.shiftsPerZone[shift.zone_id] = (metrics.shiftsPerZone[shift.zone_id] || 0) + 1;
  });

  return metrics;
}

/**
 * Analyze the schedule and retrieve AI insights.
 */
export async function analyzeSchedule(scheduleData) {
  const metrics = calculateMetrics(scheduleData);
  let aiInsights = '';

  try {
    const openai = new OpenAI();
    const analysisPrompt = `
      Schedule Analysis:
      - Total Shifts: ${metrics.totalShifts}
      - Shifts per Role: ${JSON.stringify(metrics.shiftsPerRole)}
      - Shifts per Zone: ${JSON.stringify(metrics.shiftsPerZone)}
      
      Please provide a brief analysis of staffing issues and recommendations.
    `;
    
    const aiAnalysis = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a restaurant scheduling expert." },
        { role: "user", content: analysisPrompt }
      ],
      temperature: 0.7
    });
    aiInsights = aiAnalysis.choices[0].message.content;
  } catch (error) {
    console.warn('OpenAI analysis failed:', error.message);
    aiInsights = 'AI analysis unavailable';
  }
  
  return {
    schedule: scheduleData.schedule,
    metrics,
    analysis: { aiInsights },
    warnings: metrics.warnings
  };
}
