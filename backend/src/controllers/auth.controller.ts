import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Database, User, GamificationState } from '../models/db';
import { config } from '../config';
import { AppError } from '../middlewares/error';
import { AuthenticatedRequest } from '../middlewares/auth';

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE as any
  });
};

const sendTokenCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    secure: config.ENV === 'production',
    sameSite: 'lax'
  });
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Please provide name, email and password', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  try {
    const users = Database.getUsers();
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return next(new AppError('Email address is already in use', 400));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    // Save user
    users.push(newUser);
    Database.setUsers(users);

    // Initialize Gamification State
    const gamifications = Database.getGamification();
    const initialGamification: GamificationState = {
      userId: newUser.id,
      ecoPoints: 100, // Signup bonus points
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

    gamifications.push(initialGamification);
    Database.setGamification(gamifications);

    const token = generateToken(newUser.id);
    sendTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  try {
    const users = Database.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    const token = generateToken(user.id);
    sendTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: config.ENV === 'production',
    sameSite: 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

export const getMe = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authorized', 401);
  }

  res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Not authorized', 401));
  }

  const { name, email, password } = req.body;
  const users = Database.getUsers();
  const userIndex = users.findIndex((u) => u.id === req.user!.id);

  if (userIndex === -1) {
    return next(new AppError('User not found', 404));
  }

  try {
    if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
      const emailExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        return next(new AppError('Email address is already in use', 400));
      }
      users[userIndex].email = email.toLowerCase();
    }

    if (name) {
      users[userIndex].name = name;
    }

    if (password) {
      if (password.length < 6) {
        return next(new AppError('Password must be at least 6 characters long', 400));
      }
      const salt = await bcrypt.genSalt(10);
      users[userIndex].passwordHash = await bcrypt.hash(password, salt);
    }

    Database.setUsers(users);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: users[userIndex].id,
        name: users[userIndex].name,
        email: users[userIndex].email,
        role: users[userIndex].role,
        createdAt: users[userIndex].createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
