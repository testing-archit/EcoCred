import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest, getAuthenticatedWallet } from '../middleware/auth.js';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/governance/votes - Get all votes
router.get('/votes', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const proposalId = req.query.proposalId ? parseInt(req.query.proposalId as string) : undefined;

    const where = proposalId !== undefined ? { proposalId } : {};

    const [votes, total] = await Promise.all([
        prisma.vote.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                voter: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true
                    }
                }
            }
        }),
        prisma.vote.count({ where })
    ]);

    res.json({
        votes,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
});

// GET /api/governance/votes/my - Get user's votes (authenticated)
router.get('/votes/my', authenticateToken, async (req: AuthRequest, res) => {
    const walletAddress = getAuthenticatedWallet(req);

    const company = await prisma.company.findUnique({
        where: { walletAddress }
    });

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    const votes = await prisma.vote.findMany({
        where: { voterId: company.id },
        orderBy: { createdAt: 'desc' }
    });

    res.json({ votes });
});

// POST /api/governance/votes - Cast a vote (authenticated)
router.post(
    '/votes',
    authenticateToken,
    [
        body('proposalId').isInt({ min: 0 }),
        body('support').isBoolean(),
        body('votingPower').isInt({ min: 1 }),
        body('txHash').optional().isString()
    ],
    async (req: AuthRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const { proposalId, support, votingPower, txHash } = req.body;
        const walletAddress = getAuthenticatedWallet(req);

        const company = await prisma.company.findUnique({
            where: { walletAddress }
        });

        if (!company) {
            throw new AppError('Company not found', 404);
        }

        // Check if already voted
        const existing = await prisma.vote.findUnique({
            where: {
                proposalId_voterId: {
                    proposalId,
                    voterId: company.id
                }
            }
        });

        if (existing) {
            throw new AppError('Already voted on this proposal', 400);
        }

        const vote = await prisma.vote.create({
            data: {
                proposalId,
                voterId: company.id,
                support,
                votingPower,
                txHash
            }
        });

        res.status(201).json(vote);
    }
);

// GET /api/governance/proposals/:id/results - Get proposal voting results
router.get('/proposals/:id/results', async (req, res) => {
    const proposalId = parseInt(req.params.id);

    const votes = await prisma.vote.findMany({
        where: { proposalId }
    });

    const results = votes.reduce(
        (acc, vote) => {
            if (vote.support) {
                acc.for += vote.votingPower;
                acc.forCount++;
            } else {
                acc.against += vote.votingPower;
                acc.againstCount++;
            }
            acc.totalVotingPower += vote.votingPower;
            return acc;
        },
        { for: 0, against: 0, forCount: 0, againstCount: 0, totalVotingPower: 0 }
    );

    res.json({
        proposalId,
        results,
        totalVotes: votes.length
    });
});

export default router;
