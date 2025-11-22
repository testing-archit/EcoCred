import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { verifySignature, generateToken, generateNonceMessage } from '../middleware/auth.js';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';
import crypto from 'crypto';

const router = Router();

// Store nonces temporarily (in production, use Redis)
const nonces = new Map<string, { nonce: string; timestamp: number }>();

// Clean up old nonces every 5 minutes
setInterval(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [address, data] of nonces.entries()) {
        if (data.timestamp < fiveMinutesAgo) {
            nonces.delete(address);
        }
    }
}, 5 * 60 * 1000);

// GET /api/auth/nonce - Get nonce for wallet address
router.get('/nonce/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        throw new AppError('Invalid wallet address', 400);
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    nonces.set(walletAddress.toLowerCase(), { nonce, timestamp: Date.now() });

    res.json({
        nonce,
        message: generateNonceMessage(walletAddress, nonce)
    });
});

// POST /api/auth/verify - Verify signature and get JWT token
router.post(
    '/verify',
    [
        body('walletAddress').isEthereumAddress(),
        body('signature').isString().notEmpty(),
        body('message').isString().notEmpty()
    ],
    async (req, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const { walletAddress, signature, message } = req.body;
        const normalizedAddress = walletAddress.toLowerCase();

        // Verify nonce exists
        const nonceData = nonces.get(normalizedAddress);
        if (!nonceData) {
            throw new AppError('Nonce not found or expired', 400);
        }

        // Verify signature
        const isValid = await verifySignature(walletAddress, signature, message);
        if (!isValid) {
            throw new AppError('Invalid signature', 401);
        }

        // Delete used nonce
        nonces.delete(normalizedAddress);

        // Get or create company profile
        let company = await prisma.company.findUnique({
            where: { walletAddress: normalizedAddress }
        });

        if (!company) {
            company = await prisma.company.create({
                data: {
                    walletAddress: normalizedAddress,
                    name: `Company ${walletAddress.substring(0, 8)}...`
                }
            });
        }

        // Generate JWT token
        const token = generateToken(walletAddress);

        res.json({
            token,
            company: {
                id: company.id,
                walletAddress: company.walletAddress,
                name: company.name,
                verified: company.verified
            }
        });
    }
);

export default router;
