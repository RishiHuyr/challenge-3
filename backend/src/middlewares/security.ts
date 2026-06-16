import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { AppError } from './error';

// Standard rate limiter: max 300 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for Auth endpoints (signup, login): max 30 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Double Submit Cookie CSRF implementation
// Write CSRF token to cookie and verify it in headers for POST/PUT/DELETE
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Safe methods do not require CSRF checks
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Generate CSRF token if not present
    let token = req.cookies['XSRF-TOKEN'];
    if (!token) {
      token = crypto.randomBytes(24).toString('hex');
      // Set cookie (accessible to client JS so it can send it in headers)
      res.cookie('XSRF-TOKEN', token, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    return next();
  }

  // State-changing requests must present token in header matching cookie
  const cookieToken = req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError('CSRF token validation failed', 403));
  }

  next();
};

// Input sanitization helper (basic HTML escaping to prevent XSS)
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (val: any): any => {
    if (typeof val === 'string') {
      return val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    } else if (Array.isArray(val)) {
      return val.map(sanitize);
    } else if (val !== null && typeof val === 'object') {
      const cleaned: any = {};
      for (const key in val) {
        cleaned[key] = sanitize(val[key]);
      }
      return cleaned;
    }
    return val;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};
