import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { ActionStatus } from '@prisma/client';

const router = Router();

// GET /api/actions - List all actions
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ActionStatus | undefined;

    const where = status ? { status } : {};

    const [actions, total] = await Promise.all([
        prisma.action.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true,
                        verified: true
                    }
                },
                _count: {
                    select: { documents: true, verifications: true }
                }
            }
        }),
        prisma.action.count({ where })
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

// GET /api/actions/:id - Get action details
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const action = await prisma.action.findUnique({
        where: { id },
        include: {
            company: {
                select: {
                    id: true,
                    name: true,
                    walletAddress: true,
                    verified: true
                }
            },
            documents: true,
            verifications: {
                include: {
                    verifier: {
                        select: {
                            id: true,
                            name: true,
                            walletAddress: true
                        }
                    }
                }
            }
        }
    });

    if (!action) {
        throw new AppError('Action not found', 404);
    }

    res.json(action);
});

// POST /api/actions - Submit new eco action (authenticated)
router.post(
    '/',
    authenticateToken,
    [
        body('actionType').isString().trim().notEmpty(),
        body('description').isString().trim().isLength({ min: 10, max: 500 }),
        body('quantity').isInt({ min: 1 }),
        body('unit').isString().trim().notEmpty()
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const { actionType, description, quantity, unit } = req.body;
        const walletAddress = req.user!.walletAddress.toLowerCase();

        // Get company
        const company = await prisma.company.findUnique({
            where: { walletAddress }
        });

        if (!company) {
            throw new AppError('Company not found. Please register first.', 404);
        }

        // Create action
        const action = await prisma.action.create({
            data: {
                companyId: company.id,
                actionType,
                description,
                quantity,
                unit,
                status: 'PENDING'
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true
                    }
                }
            }
        });

        res.status(201).json(action);
    }
);

// POST /api/actions/:id/verify - Verify action (verifier only)
router.post(
    '/:id/verify',
    authenticateToken,
    [
        body('approved').isBoolean(),
        body('comments').optional().isString().trim()
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const { id } = req.params;
        const { approved, comments } = req.body;
        const walletAddress = req.user!.walletAddress.toLowerCase();

        // Get verifier company
        const verifier = await prisma.company.findUnique({
            where: { walletAddress }
        });

        if (!verifier) {
            throw new AppError('Verifier not found', 404);
        }

        // TODO: Check if user has verifier role (integrate with smart contract)

        // Get action
        const action = await prisma.action.findUnique({
            where: { id }
        });

        if (!action) {
            throw new AppError('Action not found', 404);
        }

        if (action.status !== 'PENDING') {
            throw new AppError('Action already processed', 400);
        }

        // Create verification record
        const verification = await prisma.verification.create({
            data: {
                actionId: id,
                verifierId: verifier.id,
                approved,
                comments
            }
        });

        // Update action status
        const updatedAction = await prisma.action.update({
            where: { id },
            data: {
                status: approved ? 'VERIFIED' : 'REJECTED'
            },
            include: {
                company: true,
                verifications: true
            }
        });

        res.json({
            action: updatedAction,
            verification
        });
    }
);

// POST /api/actions/:id/documents - Upload supporting documents
router.post(
    '/:id/documents',
    authenticateToken,
    [
        body('fileName').isString().trim().notEmpty(),
        body('fileUrl').isURL(),
        body('fileType').isString().trim().notEmpty(),
        body('fileSize').isInt({ min: 1 })
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const { id } = req.params;
        const { fileName, fileUrl, fileType, fileSize } = req.body;
        const walletAddress = req.user!.walletAddress.toLowerCase();

        // Verify action exists and user owns it
        const action = await prisma.action.findUnique({
            where: { id },
            include: { company: true }
        });

        if (!action) {
            throw new AppError('Action not found', 404);
        }

        if (action.company.walletAddress !== walletAddress) {
            throw new AppError('Unauthorized', 403);
        }

        // Create document record
        const document = await prisma.document.create({
            data: {
                actionId: id,
                fileName,
                fileUrl,
                fileType,
                fileSize
            }
        });

        res.status(201).json(document);
    }
);

export default router;
