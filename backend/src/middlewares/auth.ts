import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Database, User } from '../models/db';
import { AppError } from './error';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;

  if (!token) {
    return next(new AppError('Authentication token is missing. Please log in.', 401));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    const users = Database.getUsers();
    const user = users.find((u) => u.id === decoded.userId);

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token. Please log in again.', 401));
  }
};

export const requireRole = (...roles: Array<'user' | 'admin'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    next();
  };
};
