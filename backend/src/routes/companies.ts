import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest, getAuthenticatedWallet } from '../middleware/auth.js';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/companies - List all companies
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('verified').optional().isBoolean()
    ],
    async (req, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const verified = req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined;

        const where = verified !== undefined ? { verified } : {};

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    walletAddress: true,
                    name: true,
                    description: true,
                    industry: true,
                    logoUrl: true,
                    verified: true,
                    createdAt: true,
                    _count: {
                        select: { actions: true }
                    }
                }
            }),
            prisma.company.count({ where })
        ]);

        // Get stats for all companies at once (more efficient)
        const companyIds = companies.map(c => c.id);
        const [actionsCounts, creditsTotals] = await Promise.all([
            prisma.action.groupBy({
                by: ['companyId'],
                where: { companyId: { in: companyIds } },
                _count: { id: true }
            }),
            prisma.action.groupBy({
                by: ['companyId'],
                where: { 
                    companyId: { in: companyIds },
                    status: 'VERIFIED'
                },
                _sum: { creditsAwarded: true }
            })
        ]);

        // Create lookup maps
        const actionsMap = new Map(actionsCounts.map(a => [a.companyId, a._count.id]));
        const creditsMap = new Map(creditsTotals.map(c => [c.companyId, c._sum.creditsAwarded || 0]));

        // Add computed fields for frontend compatibility
        const companiesWithStats = companies.map(company => ({
            ...company,
            totalActions: actionsMap.get(company.id) || 0,
            totalCredits: creditsMap.get(company.id) || 0
        }));

        res.json({
            companies: companiesWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
);

// GET /api/companies/:id - Get company details
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            actions: {
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    actionType: true,
                    description: true,
                    quantity: true,
                    unit: true,
                    status: true,
                    creditsAwarded: true,
                    createdAt: true
                }
            },
            _count: {
                select: {
                    actions: true,
                    listings: true,
                    stakes: true
                }
            }
        }
    });

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    res.json(company);
});

// POST /api/companies - Create/register company (authenticated)
router.post(
    '/',
    authenticateToken,
    [
        body('name').isString().trim().isLength({ min: 2, max: 100 }),
        body('description').optional().isString().trim().isLength({ max: 500 }),
        body('industry').optional().isString().trim(),
        body('website').optional().isURL(),
        body('location').optional().isString().trim()
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const { name, description, industry, website, location } = req.body;
        const walletAddress = getAuthenticatedWallet(req);

        // Check if company already exists
        const existing = await prisma.company.findUnique({
            where: { walletAddress }
        });

        if (existing) {
            throw new AppError('Company already registered', 400);
        }

        const company = await prisma.company.create({
            data: {
                walletAddress,
                name,
                description,
                industry,
                website,
                location
            }
        });

        res.status(201).json(company);
    }
);

// PUT /api/companies/:id - Update company profile (authenticated)
router.put(
    '/:id',
    authenticateToken,
    [
        body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
        body('description').optional().isString().trim().isLength({ max: 500 }),
        body('industry').optional().isString().trim(),
        body('website').optional().isURL(),
        body('location').optional().isString().trim(),
        body('logoUrl').optional().isURL()
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const { id } = req.params;
        const walletAddress = getAuthenticatedWallet(req);

        // Verify ownership
        const company = await prisma.company.findUnique({ where: { id } });
        if (!company) {
            throw new AppError('Company not found', 404);
        }
        if (company.walletAddress !== walletAddress) {
            throw new AppError('Unauthorized', 403);
        }

        const updated = await prisma.company.update({
            where: { id },
            data: req.body
        });

        res.json(updated);
    }
);

// GET /api/companies/:id/actions - Get company action history
router.get('/:id/actions', async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [actions, total] = await Promise.all([
        prisma.action.findMany({
            where: { companyId: id },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                documents: {
                    select: {
                        id: true,
                        fileName: true,
                        fileType: true,
                        uploadedAt: true
                    }
                },
                verifications: {
                    select: {
                        approved: true,
                        comments: true,
                        createdAt: true
                    }
                }
            }
        }),
        prisma.action.count({ where: { companyId: id } })
    ]);

    res.json({
        actions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
});

export default router;
