import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { AppError } from './errorHandler.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
    user?: {
        walletAddress: string;
        role?: string;
    };
}

// Verify JWT token
export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        throw new AppError('Authentication token required', 401);
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { walletAddress: string; role?: string };
        req.user = decoded;
        next();
    } catch (error) {
        throw new AppError('Invalid or expired token', 403);
    }
};

// Verify wallet signature and generate JWT
export const verifySignature = async (
    walletAddress: string,
    signature: string,
    message: string
): Promise<boolean> => {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
        logger.error('Signature verification failed:', error);
        return false;
    }
};

// Generate JWT token
export const generateToken = (walletAddress: string, role?: string): string => {
    return jwt.sign(
        { walletAddress, role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Generate nonce message for signing
export const generateNonceMessage = (walletAddress: string, nonce: string): string => {
    return `Sign this message to authenticate with EcoCred:\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
};

// Optional: Role-based access control
export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        if (req.user.role && roles.includes(req.user.role)) {
            next();
        } else {
            throw new AppError('Insufficient permissions', 403);
        }
    };
};
