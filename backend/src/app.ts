import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiLimiter, authLimiter, csrfProtection, sanitizeInput } from './middlewares/security';
import { errorHandler } from './middlewares/error';
import { requireAuth } from './middlewares/auth';
import * as authController from './controllers/auth.controller';
import * as calculatorController from './controllers/calculator.controller';
import * as recController from './controllers/recommendation.controller';
import * as gameController from './controllers/gamification.controller';
import * as marketController from './controllers/marketplace.controller';
import * as commController from './controllers/community.controller';

const app = express();

// 1. Basic Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: 'http://localhost:5173', // Vite frontend origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN']
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10kb' })); // Max payload size limits

// 2. Custom Security Filters
app.use(sanitizeInput); // HTML escapes to avoid XSS
app.use(csrfProtection); // Double submit cookie CSRF validation

// 3. API Rate Limiting
app.use('/api', apiLimiter);

// 4. API Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'EcoTrack Pro API is fully operational' });
});

// Auth Routes
app.post('/api/auth/signup', authLimiter, authController.signup);
app.post('/api/auth/login', authLimiter, authController.login);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/me', requireAuth as any, authController.getMe as any);
app.put('/api/auth/profile', requireAuth as any, authController.updateProfile as any);

// Carbon Calculator Routes
app.post('/api/calculator/assess', requireAuth as any, calculatorController.calculateEmissions as any);
app.get('/api/calculator/history', requireAuth as any, calculatorController.getAssessmentHistory as any);

// AI Recommendation Routes
app.get('/api/recommendations', requireAuth as any, recController.getUserRecommendations as any);
app.put('/api/recommendations/:id', requireAuth as any, recController.updateRecommendationStatus as any);

// Gamification Routes
app.get('/api/gamification', requireAuth as any, gameController.getGamificationState as any);
app.get('/api/gamification/leaderboard', requireAuth as any, gameController.getLeaderboard as any);

// Offset Marketplace Routes
app.get('/api/marketplace/projects', requireAuth as any, marketController.getProjects as any);
app.post('/api/marketplace/purchase', requireAuth as any, marketController.purchaseOffset as any);
app.get('/api/marketplace/history', requireAuth as any, marketController.getPurchaseHistory as any);

// Community Routes
app.get('/api/community/feed', requireAuth as any, commController.getFeed as any);
app.post('/api/community/feed', requireAuth as any, commController.createPost as any);
app.post('/api/community/feed/:id/like', requireAuth as any, commController.likePost as any);
app.post('/api/community/feed/:id/comment', requireAuth as any, commController.commentPost as any);

// 5. Catch All 404 Route
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// 6. Global Error Handler Middleware
app.use(errorHandler);

export default app;
