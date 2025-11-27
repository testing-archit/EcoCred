import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest, getAuthenticatedWallet } from '../middleware/auth.js';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/badges/definitions - Get all badge definitions
router.get('/definitions', async (req, res) => {
    const activeOnly = req.query.active !== 'false';
    
    const where = activeOnly ? { active: true } : {};
    
    const badges = await prisma.badgeDefinition.findMany({
        where,
        orderBy: [
            { displayOrder: 'asc' },
            { creditsRequired: 'asc' }
        ]
    });
    
    res.json({ badges });
});

// GET /api/badges/definitions/:id - Get badge definition by ID
router.get('/definitions/:id', async (req, res) => {
    const { id } = req.params;
    
    const badge = await prisma.badgeDefinition.findUnique({
        where: { id }
    });
    
    if (!badge) {
        throw new AppError('Badge definition not found', 404);
    }
    
    res.json(badge);
});

// GET /api/badges/earned - Get user's earned badges (authenticated)
router.get('/earned', authenticateToken, async (req: AuthRequest, res) => {
    const walletAddress = getAuthenticatedWallet(req);
    
    const company = await prisma.company.findUnique({
        where: { walletAddress }
    });
    
    if (!company) {
        throw new AppError('Company not found', 404);
    }
    
    const earnedBadges = await prisma.earnedBadge.findMany({
        where: { companyId: company.id },
        include: {
            badge: true
        },
        orderBy: { earnedAt: 'desc' }
    });
    
    res.json({ earnedBadges });
});

// GET /api/badges/earned/:companyId - Get company's earned badges
router.get('/earned/:companyId', async (req, res) => {
    const { companyId } = req.params;
    
    const earnedBadges = await prisma.earnedBadge.findMany({
        where: { companyId },
        include: {
            badge: true
        },
        orderBy: { earnedAt: 'desc' }
    });
    
    res.json({ earnedBadges });
});

// GET /api/badges/:companyId/available - Get all badges with earned status for a company
router.get('/:companyId/available', async (req, res) => {
    const { companyId } = req.params;
    
    // Get all badge definitions
    const allBadges = await prisma.badgeDefinition.findMany({
        where: { active: true },
        orderBy: [
            { displayOrder: 'asc' },
            { creditsRequired: 'asc' }
        ]
    });
    
    // Get company's earned badges
    const earnedBadges = await prisma.earnedBadge.findMany({
        where: { companyId },
        include: {
            badge: true
        }
    });
    
    const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.badgeId));
    
    // Combine with earned status
    const badgesWithStatus = allBadges.map(badge => {
        const earned = earnedBadges.find(eb => eb.badgeId === badge.id);
        return {
            ...badge,
            earned: !!earned,
            earnedAt: earned?.earnedAt || null,
            tokenId: earned?.tokenId || null
        };
    });
    
    res.json({ badges: badgesWithStatus });
});

// POST /api/badges/definitions - Create badge definition (admin only)
router.post(
    '/definitions',
    authenticateToken,
    [
        body('name').isString().trim().notEmpty(),
        body('description').isString().trim().notEmpty(),
        body('tier').isIn(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']),
        body('creditsRequired').isInt({ min: 0 }),
    ],
    async (req: AuthRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }
        
        const {
            name,
            description,
            tier,
            icon,
            imageUrl,
            creditsRequired,
            criteria,
            displayOrder = 0,
            active = true
        } = req.body;
        
        const badge = await prisma.badgeDefinition.create({
            data: {
                name,
                description,
                tier,
                icon,
                imageUrl,
                creditsRequired,
                criteria,
                displayOrder,
                active
            }
        });
        
        res.status(201).json(badge);
    }
);

// POST /api/badges/earned - Record earned badge (authenticated or admin)
router.post(
    '/earned',
    authenticateToken,
    [
        body('badgeId').isString().notEmpty(),
        body('tokenId').optional().isInt(),
        body('txHash').optional().isString(),
    ],
    async (req: AuthRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }
        
        const walletAddress = getAuthenticatedWallet(req);
        const { badgeId, tokenId, txHash } = req.body;
        
        const company = await prisma.company.findUnique({
            where: { walletAddress }
        });
        
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        
        // Check if badge already earned
        const existing = await prisma.earnedBadge.findUnique({
            where: {
                badgeId_companyId: {
                    badgeId,
                    companyId: company.id
                }
            }
        });
        
        if (existing) {
            throw new AppError('Badge already earned', 400);
        }
        
        const earnedBadge = await prisma.earnedBadge.create({
            data: {
                badgeId,
                companyId: company.id,
                tokenId,
                txHash
            },
            include: {
                badge: true
            }
        });
        
        res.status(201).json(earnedBadge);
    }
);

export default router;

