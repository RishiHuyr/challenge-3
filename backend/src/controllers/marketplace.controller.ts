import { Response, NextFunction } from 'express';
import { Database, OffsetProject, OffsetPurchase, GamificationState } from '../models/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';

const OFFSET_PROJECTS: OffsetProject[] = [
  {
    id: 'project_reforest',
    title: 'Amazon Reforestation',
    description: 'Plant native trees in the Amazon basin to restore devastated ecosystems and capture carbon.',
    category: 'forestry',
    costPoints: 400,
    co2Offset: 100,
    imageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=400&q=80',
    location: 'Brazil'
  },
  {
    id: 'project_solar',
    title: 'Sahara Solar Farm Initiative',
    description: 'Support the deployment of massive solar arrays in North Africa to supply clean power to the regional grid.',
    category: 'solar',
    costPoints: 600,
    co2Offset: 200,
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&q=80',
    location: 'Morocco'
  },
  {
    id: 'project_wind',
    title: 'Offshore Wind Development',
    description: 'Finance offshore wind turbine installations in the North Sea to displace coal and gas-fired energy plants.',
    category: 'wind',
    costPoints: 800,
    co2Offset: 300,
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=400&q=80',
    location: 'Denmark'
  },
  {
    id: 'project_ocean',
    title: 'Kelps & Coastal Restoration',
    description: 'Fund macroalgae (kelp) farming in coastal waters to capture carbon rapidly while reversing ocean acidification.',
    category: 'ocean',
    costPoints: 500,
    co2Offset: 150,
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80',
    location: 'Australia'
  }
];

export const getProjects = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  res.status(200).json({
    success: true,
    data: OFFSET_PROJECTS
  });
};

export const purchaseOffset = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  const { projectId } = req.body;

  if (!projectId) {
    return next(new AppError('Project ID is required to buy an offset', 400));
  }

  const project = OFFSET_PROJECTS.find((p) => p.id === projectId);
  if (!project) {
    return next(new AppError('Project not found in marketplace', 404));
  }

  try {
    const gamifications = Database.getGamification();
    const gIndex = gamifications.findIndex((g) => g.userId === req.user!.id);

    if (gIndex === -1 || gamifications[gIndex].ecoPoints < project.costPoints) {
      return next(new AppError(`Insufficient Eco Points. You need ${project.costPoints} points, but you have ${gIndex !== -1 ? gamifications[gIndex].ecoPoints : 0}`, 400));
    }

    const gState = gamifications[gIndex];
    gState.ecoPoints -= project.costPoints;

    const purchase: OffsetPurchase = {
      id: Math.random().toString(36).substring(2, 11),
      userId: req.user.id,
      projectId: project.id,
      projectTitle: project.title,
      costPoints: project.costPoints,
      co2Offset: project.co2Offset,
      purchaseDate: new Date().toISOString()
    };

    // Save purchase record
    const purchases = Database.getPurchases();
    purchases.push(purchase);
    Database.setPurchases(purchases);

    // Update Marketplace challenge (offset_purchase)
    const offsetChallenge = gState.challenges.find((c) => c.id === 'offset_purchase');
    let extraFeedback = '';
    if (offsetChallenge && !offsetChallenge.completed) {
      offsetChallenge.currentValue = 1;
      offsetChallenge.completed = true;
      gState.ecoPoints += offsetChallenge.pointsReward;

      // Add Badge: Eco Investor
      gState.badges.push({
        id: 'badge_eco_investor',
        name: 'Eco Investor',
        description: 'Funded a carbon-reduction project in the marketplace',
        icon: '💵',
        unlockedAt: new Date().toISOString()
      });
      extraFeedback += ` Unlocked Achievement: Eco Investor! (+${offsetChallenge.pointsReward} points).`;
    }

    gamifications[gIndex] = gState;
    Database.setGamification(gamifications);

    res.status(201).json({
      success: true,
      message: `Successfully purchased carbon offset for ${project.title}.${extraFeedback}`,
      data: {
        purchase,
        currentPoints: gState.ecoPoints
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseHistory = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  try {
    const purchases = Database.getPurchases();
    const userPurchases = purchases
      .filter((p) => p.userId === req.user!.id)
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

    res.status(200).json({
      success: true,
      data: userPurchases
    });
  } catch (error) {
    next(error);
  }
};
