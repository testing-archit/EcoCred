import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest, getAuthenticatedWallet } from '../middleware/auth.js';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/staking/stakes - Get all stakes
router.get('/stakes', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [stakes, total] = await Promise.all([
        prisma.stake.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                staker: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true
                    }
                }
            }
        }),
        prisma.stake.count()
    ]);

    res.json({
        stakes,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
});

// GET /api/staking/stakes/my - Get user's stakes (authenticated)
router.get('/stakes/my', authenticateToken, async (req: AuthRequest, res) => {
    const walletAddress = getAuthenticatedWallet(req);

    const company = await prisma.company.findUnique({
        where: { walletAddress }
    });

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    const stakes = await prisma.stake.findMany({
        where: { stakerId: company.id },
        orderBy: { createdAt: 'desc' }
    });

    res.json({ stakes });
});

// POST /api/staking/stakes - Create new stake (authenticated)
router.post(
    '/stakes',
    authenticateToken,
    [
        body('amount').isFloat({ min: 0.01 }),
        body('duration').isInt({ min: 1 }),
        body('stakeId').optional().isInt(),
        body('txHash').optional().isString()
    ],
    async (req: AuthRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const { amount, duration, stakeId, txHash } = req.body;
        const walletAddress = getAuthenticatedWallet(req);

        const company = await prisma.company.findUnique({
            where: { walletAddress }
        });

        if (!company) {
            throw new AppError('Company not found', 404);
        }

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + duration * 1000);

        const stake = await prisma.stake.create({
            data: {
                stakerId: company.id,
                amount,
                duration,
                startTime,
                endTime,
                stakeId,
                txHash
            }
        });

        res.status(201).json(stake);
    }
);

// PUT /api/staking/stakes/:id/claim - Claim stake rewards (authenticated)
router.put(
    '/stakes/:id/claim',
    authenticateToken,
    async (req: AuthRequest, res) => {
        const { id } = req.params;
        const walletAddress = getAuthenticatedWallet(req);

        const stake = await prisma.stake.findUnique({
            where: { id },
            include: { staker: true }
        });

        if (!stake) {
            throw new AppError('Stake not found', 404);
        }

        if (stake.staker.walletAddress !== walletAddress) {
            throw new AppError('Unauthorized', 403);
        }

        if (stake.claimed) {
            throw new AppError('Stake already claimed', 400);
        }

        if (new Date() < stake.endTime) {
            throw new AppError('Stake period not ended yet', 400);
        }

        const updated = await prisma.stake.update({
            where: { id },
            data: { claimed: true }
        });

        res.json(updated);
    }
);

export default router;
