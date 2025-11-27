import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/app.js';

export interface ApiError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log error
    logger.error('API Error:', {
        statusCode,
        message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Send error response
    res.status(statusCode).json({
        error: {
            message,
            ...(config.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

export class AppError extends Error implements ApiError {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
