import { Response, NextFunction } from 'express';
import { Database, GamificationState, User } from '../models/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';

export const getGamificationState = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  try {
    const gamifications = Database.getGamification();
    let state = gamifications.find((g) => g.userId === req.user!.id);

    if (!state) {
      // Lazy initialization if not created at signup
      state = {
        userId: req.user.id,
        ecoPoints: 0,
        streak: 0,
        sustainabilityScore: 0,
        badges: [],
        challenges: [
          {
            id: 'first_assessment',
            title: 'First Assessment',
            description: 'Complete your first carbon assessment',
            category: 'calculator',
            pointsReward: 150,
            targetValue: 1,
            currentValue: 0,
            completed: false
          },
          {
            id: 'offset_purchase',
            title: 'Eco Investor',
            description: 'Purchase your first carbon offset from the marketplace',
            category: 'marketplace',
            pointsReward: 200,
            targetValue: 1,
            currentValue: 0,
            completed: false
          },
          {
            id: 'community_post',
            title: 'Eco Advocate',
            description: 'Create a post sharing your sustainability achievements',
            category: 'community',
            pointsReward: 100,
            targetValue: 1,
            currentValue: 0,
            completed: false
          },
          {
            id: 'save_carbon',
            title: 'Green Saver',
            description: 'Unlock total carbon reduction of 50kg CO₂',
            category: 'recommendations',
            pointsReward: 300,
            targetValue: 50,
            currentValue: 0,
            completed: false
          }
        ]
      };
      gamifications.push(state);
      Database.setGamification(gamifications);
    }

    res.status(200).json({
      success: true,
      data: state
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  try {
    const gamifications = Database.getGamification();
    const users = Database.getUsers();

    // Map and build leaderboard with user names
    const leaderboard = gamifications.map((g) => {
      const u = users.find((user) => user.id === g.userId);
      return {
        userId: g.userId,
        name: u ? u.name : 'Eco Tracker User',
        ecoPoints: g.ecoPoints,
        streak: g.streak,
        sustainabilityScore: g.sustainabilityScore,
        badgesCount: g.badges.length
      };
    });

    // Sort by ecoPoints descending
    leaderboard.sort((a, b) => b.ecoPoints - a.ecoPoints);

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};
