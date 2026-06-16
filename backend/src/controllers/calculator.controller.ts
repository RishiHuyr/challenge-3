import { Response, NextFunction } from 'express';
import { Database, Assessment, GamificationState, Recommendation } from '../models/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { generateRecommendationsForUser } from './recommendation.controller';

export const calculateEmissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  const { transportation, diet, energy, waste, shopping } = req.body;

  // Basic validation
  if (!transportation || !diet || !energy || !waste || !shopping) {
    return next(new AppError('All steps of the assessment are required', 400));
  }

  try {
    // 1. Calculations (Monthly figures)
    // Transportation: car (km * 0.171), public transport (km * 0.046), bike (0), flights (hours * 90), rideshare (km * 0.08)
    const transEmissions =
      (transportation.carKm || 0) * 0.171 +
      (transportation.transitKm || 0) * 0.046 +
      (transportation.bikeKm || 0) * 0 +
      (transportation.flightsHours || 0) * 90 +
      (transportation.rideshareKm || 0) * 0.08;

    // Diet: Monthly emissions (Vegan = 90kg, Vegetarian = 140kg, Mixed = 230kg, Heavy Meat = 380kg)
    let dietEmissions = 230;
    if (diet.dietType === 'vegan') dietEmissions = 90;
    else if (diet.dietType === 'vegetarian') dietEmissions = 140;
    else if (diet.dietType === 'heavy-meat') dietEmissions = 380;

    // Energy: electricity (kWh * 0.38), gas (kWh * 0.18), offset by renewable %
    const baseEnergy = (energy.electricityKwh || 0) * 0.38 + (energy.gasKwh || 0) * 0.18;
    const energyEmissions = baseEnergy * (1 - (energy.renewablePercent || 0) / 100);

    // Waste: general waste (kg * 0.45) minus recycling reduction (up to 80% savings), plastic (score * 12)
    const baseWaste = (waste.wasteKg || 0) * 0.45;
    const recycledWaste = baseWaste * (1 - (waste.recyclingPercent || 0) / 100 * 0.8);
    const wasteEmissions = recycledWaste + (waste.plasticUsageScore || 3) * 12;

    // Shopping: fashion ($ * 0.45), electronics ($ * 0.85), consumer goods ($ * 0.32)
    const shoppingEmissions =
      (shopping.fashionSpend || 0) * 0.45 +
      (shopping.electronicsSpend || 0) * 0.85 +
      (shopping.goodsSpend || 0) * 0.32;

    const totalEmissions = Math.round(
      transEmissions + dietEmissions + energyEmissions + wasteEmissions + shoppingEmissions
    );

    // Sustainability score (100 is best, decays as emissions grow relative to target 1200kg CO2/month)
    const maxTarget = 1500;
    const sustainabilityScore = Math.max(0, Math.min(100, Math.round(100 - (totalEmissions / maxTarget) * 100)));

    const assessment: Assessment = {
      id: Math.random().toString(36).substring(2, 11),
      userId: req.user.id,
      date: new Date().toISOString().split('T')[0],
      transportation: {
        carKm: Number(transportation.carKm) || 0,
        bikeKm: Number(transportation.bikeKm) || 0,
        transitKm: Number(transportation.transitKm) || 0,
        flightsHours: Number(transportation.flightsHours) || 0,
        rideshareKm: Number(transportation.rideshareKm) || 0
      },
      diet: {
        dietType: diet.dietType
      },
      energy: {
        electricityKwh: Number(energy.electricityKwh) || 0,
        gasKwh: Number(energy.gasKwh) || 0,
        renewablePercent: Number(energy.renewablePercent) || 0
      },
      waste: {
        recyclingPercent: Number(waste.recyclingPercent) || 0,
        plasticUsageScore: Number(waste.plasticUsageScore) || 3,
        wasteKg: Number(waste.wasteKg) || 0
      },
      shopping: {
        fashionSpend: Number(shopping.fashionSpend) || 0,
        electronicsSpend: Number(shopping.electronicsSpend) || 0,
        goodsSpend: Number(shopping.goodsSpend) || 0
      },
      emissions: {
        transportation: Math.round(transEmissions),
        diet: Math.round(dietEmissions),
        energy: Math.round(energyEmissions),
        waste: Math.round(wasteEmissions),
        shopping: Math.round(shoppingEmissions),
        total: totalEmissions
      },
      sustainabilityScore,
      createdAt: new Date().toISOString()
    };

    // Save assessment
    const assessments = Database.getAssessments();
    assessments.push(assessment);
    Database.setAssessments(assessments);

    // 2. Update Gamification Streaks and Points
    const gamifications = Database.getGamification();
    const gIndex = gamifications.findIndex((g) => g.userId === req.user!.id);
    let pointsEarned = 50; // Points for logging assessment
    let streakIncremented = false;

    if (gIndex !== -1) {
      const gState = gamifications[gIndex];
      gState.sustainabilityScore = sustainabilityScore;

      // Update streaks
      const todayStr = new Date().toISOString().split('T')[0];
      if (gState.lastActiveDate) {
        const lastActive = new Date(gState.lastActiveDate);
        const today = new Date(todayStr);
        const diffTime = Math.abs(today.getTime() - lastActive.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          gState.streak += 1;
          streakIncremented = true;
          pointsEarned += 20; // Bonus for consecutive active days
        } else if (diffDays > 1) {
          gState.streak = 1; // Reset streak
        }
      } else {
        gState.streak = 1; // Initial streak
      }
      gState.lastActiveDate = todayStr;

      // Check Challenges
      // Challenge 1: First Assessment
      const firstAssChallenge = gState.challenges.find((c) => c.id === 'first_assessment');
      if (firstAssChallenge && !firstAssChallenge.completed) {
        firstAssChallenge.currentValue = 1;
        firstAssChallenge.completed = true;
        gState.ecoPoints += firstAssChallenge.pointsReward;
        
        // Add Badge: First Step
        gState.badges.push({
          id: 'badge_first_step',
          name: 'First Step',
          description: 'Completed your first carbon footprint calculation',
          icon: '🌱',
          unlockedAt: new Date().toISOString()
        });
      }

      gState.ecoPoints += pointsEarned;
      gamifications[gIndex] = gState;
      Database.setGamification(gamifications);
    }

    // 3. Generate recommendation deck
    generateRecommendationsForUser(req.user.id, assessment);

    res.status(201).json({
      success: true,
      message: 'Assessment completed and emissions calculated successfully',
      data: {
        assessment,
        pointsEarned,
        streakIncremented
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAssessmentHistory = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  try {
    const assessments = Database.getAssessments();
    const userAssessments = assessments
      .filter((a) => a.userId === req.user!.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({
      success: true,
      data: userAssessments
    });
  } catch (error) {
    next(error);
  }
};
