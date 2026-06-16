import { Request, Response, NextFunction } from 'express';
import { Database, Assessment, Recommendation, GamificationState } from '../models/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';

interface RecommendationTemplate {
  title: string;
  description: string;
  category: 'transportation' | 'diet' | 'energy' | 'waste' | 'shopping';
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  co2Savings: number;
}

const RECOMMENDATION_TEMPLATES: RecommendationTemplate[] = [
  // Transportation
  {
    title: 'Ditch the Car for Short Trips',
    description: 'Try walking or cycling for trips under 3km. This cuts local air pollution and improves cardiovascular health.',
    category: 'transportation',
    impact: 'medium',
    difficulty: 'easy',
    co2Savings: 35
  },
  {
    title: 'Transition to Public Transit',
    description: 'Replace your solo car commutes with train, subway, or bus trips to cut your transit emissions by over 50%.',
    category: 'transportation',
    impact: 'high',
    difficulty: 'medium',
    co2Savings: 110
  },
  {
    title: 'Rideshare and Carpool',
    description: 'When driving is necessary, carpool with colleagues or use rideshare pooling to divide emissions among passengers.',
    category: 'transportation',
    impact: 'medium',
    difficulty: 'easy',
    co2Savings: 45
  },
  {
    title: 'Avoid Short-Haul Flights',
    description: 'For distances under 500km, take high-speed rail instead of flying. Takeoff and landing burn the most jet fuel.',
    category: 'transportation',
    impact: 'high',
    difficulty: 'hard',
    co2Savings: 250
  },

  // Diet
  {
    title: 'Initiate Meatless Mondays',
    description: 'Swap meat for legumes or plant proteins one day a week. Animal agriculture is highly resource-intensive.',
    category: 'diet',
    impact: 'medium',
    difficulty: 'easy',
    co2Savings: 40
  },
  {
    title: 'Adopt a Vegetarian Diet',
    description: 'Eliminate beef, pork, and poultry. Reducing livestock demand directly reduces methane and deforestation.',
    category: 'diet',
    impact: 'high',
    difficulty: 'medium',
    co2Savings: 120
  },
  {
    title: 'Go Vegan for the Planet',
    description: 'Eliminate dairy and eggs. A plant-based diet is the single most effective way to reduce food carbon footprint.',
    category: 'diet',
    impact: 'high',
    difficulty: 'hard',
    co2Savings: 180
  },

  // Energy
  {
    title: 'Switch to energy-saving LED bulbs',
    description: 'Replace remaining incandescent bulbs. LEDs use up to 85% less energy and last 25 times longer.',
    category: 'energy',
    impact: 'low',
    difficulty: 'easy',
    co2Savings: 15
  },
  {
    title: 'Smart Thermostat Regulation',
    description: 'Adjust thermostat 2°C lower in winter and 2°C higher in summer. Heating and cooling are major home energy users.',
    category: 'energy',
    impact: 'medium',
    difficulty: 'easy',
    co2Savings: 50
  },
  {
    title: 'Switch to a 100% Renewable Tariff',
    description: 'Contact your energy provider to switch to a certified green energy option, or buy community solar shares.',
    category: 'energy',
    impact: 'high',
    difficulty: 'medium',
    co2Savings: 200
  },

  // Waste
  {
    title: 'Eliminate Single-Use Plastics',
    description: 'Use canvas tote bags, stainless steel bottles, and silicone wraps. Plastics originate from refined petroleum.',
    category: 'waste',
    impact: 'medium',
    difficulty: 'easy',
    co2Savings: 25
  },
  {
    title: 'Optimize Recycling Separation',
    description: 'Wash containers and sort cardboard, aluminum, and glass correctly to maximize local municipality recycling success.',
    category: 'waste',
    impact: 'medium',
    difficulty: 'easy',
    co2Savings: 30
  },
  {
    title: 'Set Up Home Composting',
    description: 'Divert food scraps from general waste. Composting avoids anaerobic decay in landfills which creates methane.',
    category: 'waste',
    impact: 'high',
    difficulty: 'medium',
    co2Savings: 65
  },

  // Shopping
  {
    title: 'Circular Wardrobe (Secondhand First)',
    description: 'Acquire clothing from thrift stores, consignment platforms, or clothing swaps instead of buying brand new.',
    category: 'shopping',
    impact: 'medium',
    difficulty: 'easy',
    co2Savings: 35
  },
  {
    title: 'Repair Electronics Before Replacing',
    description: 'Mend broken screens or swap batteries. Manufacturing new technology requires extensive mining and energy.',
    category: 'shopping',
    impact: 'high',
    difficulty: 'medium',
    co2Savings: 100
  },
  {
    title: 'Enforce a 48-Hour Purchase Cool-Off',
    description: 'Wait 48 hours before buying non-essentials. Reducing general retail shopping saves production emissions.',
    category: 'shopping',
    impact: 'medium',
    difficulty: 'easy',
    co2Savings: 50
  }
];

export const generateRecommendationsForUser = (userId: string, latestAssessment: Assessment) => {
  const allRecs = Database.getRecommendations();

  // Keep existing active or completed recommendations
  const keptRecs = allRecs.filter((r) => r.userId === userId && r.status !== 'available');

  // Determine highest emission category from this assessment
  const emissions = latestAssessment.emissions;
  const categories: Array<{ name: 'transportation' | 'diet' | 'energy' | 'waste' | 'shopping'; value: number }> = [
    { name: 'transportation', value: emissions.transportation },
    { name: 'diet', value: emissions.diet },
    { name: 'energy', value: emissions.energy },
    { name: 'waste', value: emissions.waste },
    { name: 'shopping', value: emissions.shopping }
  ];

  // Sort by highest value
  categories.sort((a, b) => b.value - a.value);

  // Take the top 2 highest emitting categories
  const highestCategory = categories[0].name;
  const secondHighestCategory = categories[1].name;

  // Filter templates matching these categories
  const targetTemplates = RECOMMENDATION_TEMPLATES.filter(
    (t) => t.category === highestCategory || t.category === secondHighestCategory
  );

  // Generate 4 recommendations
  const newRecs: Recommendation[] = [];
  const selectedTemplates = targetTemplates.slice(0, 4);

  // If we don't have enough, fill in with others
  if (selectedTemplates.length < 4) {
    const remaining = RECOMMENDATION_TEMPLATES.filter(
      (t) => t.category !== highestCategory && t.category !== secondHighestCategory
    );
    selectedTemplates.push(...remaining.slice(0, 4 - selectedTemplates.length));
  }

  selectedTemplates.forEach((template) => {
    // Check if the user already has this active or completed
    const alreadyExists = keptRecs.some((r) => r.title === template.title);
    if (!alreadyExists) {
      newRecs.push({
        id: Math.random().toString(36).substring(2, 11),
        userId,
        title: template.title,
        description: template.description,
        category: template.category,
        impact: template.impact,
        difficulty: template.difficulty,
        co2Savings: template.co2Savings,
        status: 'available',
        createdAt: new Date().toISOString()
      });
    }
  });

  const updatedRecs = [...allRecs.filter((r) => !(r.userId === userId && r.status === 'available')), ...newRecs];
  Database.setRecommendations(updatedRecs);
};

export const getUserRecommendations = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  try {
    const allRecs = Database.getRecommendations();
    const userRecs = allRecs.filter((r) => r.userId === req.user!.id);
    res.status(200).json({
      success: true,
      data: userRecs
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecommendationStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  const { id } = req.params;
  const { status } = req.body; // 'active' | 'completed'

  if (!status || !['active', 'completed'].includes(status)) {
    return next(new AppError('Valid status of active or completed is required', 400));
  }

  try {
    const recs = Database.getRecommendations();
    const index = recs.findIndex((r) => r.id === id && r.userId === req.user!.id);

    if (index === -1) {
      return next(new AppError('Recommendation not found', 404));
    }

    const rec = recs[index];
    const prevStatus = rec.status;
    rec.status = status;
    recs[index] = rec;
    Database.setRecommendations(recs);

    let pointsAwarded = 0;
    let feedbackMsg = '';

    // If marked as completed, trigger gamification rules!
    if (status === 'completed' && prevStatus !== 'completed') {
      const difficultyPoints = rec.difficulty === 'easy' ? 50 : rec.difficulty === 'medium' ? 100 : 200;
      pointsAwarded = difficultyPoints;

      const gamifications = Database.getGamification();
      const gIndex = gamifications.findIndex((g) => g.userId === req.user!.id);

      if (gIndex !== -1) {
        const gState = gamifications[gIndex];
        gState.ecoPoints += pointsAwarded;

        // Update Green Saver challenge progress (save_carbon)
        const saveCarbonChallenge = gState.challenges.find((c) => c.id === 'save_carbon');
        if (saveCarbonChallenge && !saveCarbonChallenge.completed) {
          saveCarbonChallenge.currentValue = Number((saveCarbonChallenge.currentValue + rec.co2Savings).toFixed(1));
          if (saveCarbonChallenge.currentValue >= saveCarbonChallenge.targetValue) {
            saveCarbonChallenge.completed = true;
            gState.ecoPoints += saveCarbonChallenge.pointsReward;
            pointsAwarded += saveCarbonChallenge.pointsReward;
            feedbackMsg += ` Unlocked Achievement: Green Saver! (+${saveCarbonChallenge.pointsReward} pts).`;
          }
        }

        // Calculate total savings from all completed recommendations to unlock milestones
        const userCompletedRecs = recs.filter((r) => r.userId === req.user!.id && r.status === 'completed');
        const totalSavings = userCompletedRecs.reduce((sum, r) => sum + r.co2Savings, 0);

        // Badge: 100kg CO2 Saved
        const has100kgBadge = gState.badges.some((b) => b.id === 'badge_100kg_saved');
        if (totalSavings >= 100 && !has100kgBadge) {
          gState.badges.push({
            id: 'badge_100kg_saved',
            name: 'Eco Champion',
            description: 'Saved over 100kg of CO₂ through completed recommendations',
            icon: '🏆',
            unlockedAt: new Date().toISOString()
          });
          feedbackMsg += ' Unlocked Badge: Eco Champion! 🏆';
        }

        // Badge: Carbon Saver (completed 5 recommendations)
        const hasSaverBadge = gState.badges.some((b) => b.id === 'badge_carbon_saver');
        if (userCompletedRecs.length >= 5 && !hasSaverBadge) {
          gState.badges.push({
            id: 'badge_carbon_saver',
            name: 'Carbon Crusader',
            description: 'Completed 5 sustainable actions',
            icon: '⚡',
            unlockedAt: new Date().toISOString()
          });
          feedbackMsg += ' Unlocked Badge: Carbon Crusader! ⚡';
        }

        gamifications[gIndex] = gState;
        Database.setGamification(gamifications);
      }
    }

    res.status(200).json({
      success: true,
      message: `Recommendation marked as ${status}.${feedbackMsg}`,
      data: {
        recommendation: rec,
        pointsAwarded
      }
    });
  } catch (error) {
    next(error);
  }
};
