import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './utils/logger.js';
import { errorHandler, ApiError } from './middleware/errorHandler.js';
import { config } from './config/app.js';

// Async error wrapper to catch errors in async route handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Import routes
import companiesRouter from './routes/companies.js';
import actionsRouter from './routes/actions.js';
import analyticsRouter from './routes/analytics.js';
import marketplaceRouter from './routes/marketplace.js';
import stakingRouter from './routes/staking.js';
import governanceRouter from './routes/governance.js';
import authRouter from './routes/auth.js';
import actionTypesRouter from './routes/action-types.js';
import badgesRouter from './routes/badges.js';
import leaderboardRouter from './routes/leaderboard.js';
import referenceDataRouter from './routes/reference-data.js';

// No .env files needed - using automatic configuration!
const app: Express = express();
const PORT = config.PORT;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/staking', stakingRouter);
app.use('/api/governance', governanceRouter);
app.use('/api/action-types', actionTypesRouter);
app.use('/api/badges', badgesRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/reference', referenceDataRouter);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    // Don't exit the process, just log the error
    // In production, you might want to exit gracefully
});

// Start server only if not in Vercel (Vercel will use the exported app)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        logger.info(`🚀 EcoCred API server running on port ${PORT}`);
        logger.info(`📊 Environment: ${config.NODE_ENV}`);
        logger.info(`🌐 CORS enabled for: ${config.CORS_ORIGIN}`);
        logger.info(`✅ No .env files needed - using automatic configuration!`);
    });
}

export default app;

