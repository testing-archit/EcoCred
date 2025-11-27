import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { AppError } from './errorHandler.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/app.js';

const JWT_SECRET = config.JWT_SECRET;

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        walletAddress?: string;
        role: string;
    };
}

export const getAuthenticatedWallet = (req: AuthRequest): string => {
    const wallet = req.user?.walletAddress;
    if (!wallet) {
        throw new AppError('Wallet authentication required', 401);
    }
    return wallet.toLowerCase();
};

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
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; walletAddress?: string };
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            walletAddress: decoded.walletAddress
        };
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

// Generate JWT token with userId and role
export const generateToken = (userId: string, role: string, walletAddress?: string): string => {
    return jwt.sign(
        { userId, role, walletAddress },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Generate nonce message for signing
export const generateNonceMessage = (walletAddress: string, nonce: string): string => {
    return `Sign this message to authenticate with EcoCred:\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
};

// Role-based access control middleware
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

