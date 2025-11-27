import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest, getAuthenticatedWallet } from '../middleware/auth.js';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { ActionStatus } from '@prisma/client';

const router = Router();

// GET /api/actions - List all actions (or company-specific if authenticated)
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ActionStatus | undefined;

    const where: Record<string, unknown> = {};
    
    // Filter by status if provided
    if (status) {
        where.status = status;
    }
    
    // Try to get authenticated user's wallet and filter by company
    // If status is provided (e.g., PENDING for verifiers), show all actions with that status
    // Otherwise, filter by company for authenticated company users
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const walletAddress = getAuthenticatedWallet(req as AuthRequest);
            if (walletAddress) {
                const company = await prisma.company.findUnique({
                    where: { walletAddress },
                    select: { id: true, walletAddress: true }
                });
                
                // If status is provided (verifier/auditor viewing pending), don't filter by company
                // Otherwise, show only their company's actions
                if (company && !status) {
                    where.companyId = company.id;
                }
            }
        }
    } catch {
        // Not authenticated or invalid token, show all actions (or filtered by status only)
    }

    console.log(`[Actions] Fetching actions with filter:`, JSON.stringify(where, null, 2));
    
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

    console.log(`[Actions] Found ${actions.length} actions (total: ${total})`);

    // Load action types to calculate estimated credits for pending actions
    const actionTypes = await prisma.actionType.findMany({
        where: { active: true },
        select: {
            type: true,
            defaultCreditsPerUnit: true,
            minCreditsPerUnit: true,
            maxCreditsPerUnit: true
        }
    });
    const actionTypesMap = new Map(
        actionTypes.map(at => [
            at.type,
            at.defaultCreditsPerUnit || at.minCreditsPerUnit || 0
        ])
    );

    // Transform actions for frontend compatibility
    const transformedActions = actions.map(action => {
        // Calculate estimated credits for pending actions
        let estimatedCredits = action.creditsAwarded || 0;
        if (action.status === 'PENDING' && action.quantity) {
            const creditsPerUnit = actionTypesMap.get(action.actionType) || 0;
            estimatedCredits = action.quantity * creditsPerUnit;
        }
        
        return {
            ...action,
            type: action.actionType, // Map actionType to type
            creditsEarned: action.creditsAwarded || 0, // Map creditsAwarded to creditsEarned
            estimatedCredits // Add estimatedCredits for pending actions
        };
    });

    res.json({
        data: transformedActions, // Frontend expects 'data'
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
        const walletAddress = getAuthenticatedWallet(req);

        // Get company
        const company = await prisma.company.findUnique({
            where: { walletAddress }
        });

        if (!company) {
            throw new AppError('Company not found. Please register first.', 404);
        }

        // Create action
        console.log(`[Actions] Creating action for company ${company.id}:`, {
            actionType,
            description: description.substring(0, 50) + '...',
            quantity,
            unit
        });
        
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

        console.log(`[Actions] Action created successfully with ID: ${action.id}`);
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
        const walletAddress = getAuthenticatedWallet(req);
        const userRole = req.user?.role;

        // Check if user has verifier role
        if (userRole !== 'VERIFIER' && userRole !== 'ADMIN') {
            throw new AppError('Only verifiers and admins can verify actions', 403);
        }

        // Get action first
        const action = await prisma.action.findUnique({
            where: { id }
        });

        if (!action) {
            throw new AppError('Action not found', 404);
        }

        if (action.status !== 'PENDING') {
            throw new AppError('Action already processed', 400);
        }

        // Get or create verifier company
        // Verifiers need a Company record for the verification relation
        let verifier = await prisma.company.findUnique({
            where: { walletAddress }
        });

        if (!verifier) {
            // Get user info to create company with appropriate name
            const user = await prisma.user.findUnique({
                where: { walletAddress }
            });

            if (!user) {
                throw new AppError('Verifier user not found', 404);
            }

            // Create a company record for this verifier
            verifier = await prisma.company.create({
                data: {
                    walletAddress: walletAddress,
                    name: user.email ? `${user.email.split('@')[0]} (Verifier)` : `Verifier ${walletAddress.slice(0, 8)}`,
                    verified: true // Auto-verify verifiers
                }
            });

            console.log(`[Actions] Created company record for verifier: ${verifier.id}`);
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

        // Calculate credits if approved
        let creditsAwarded = 0;
        if (approved) {
            // Get action type to calculate credits
            const actionType = await prisma.actionType.findUnique({
                where: { type: action.actionType }
            });
            
            if (actionType) {
                // Calculate credits based on quantity and credits per unit
                creditsAwarded = action.quantity * (actionType.defaultCreditsPerUnit || 0);
            } else {
                // Fallback: use estimated credits if action type not found
                creditsAwarded = action.creditsAwarded || 0;
            }
        }

        // Update action status and credits
        const updatedAction = await prisma.action.update({
            where: { id },
            data: {
                status: approved ? 'VERIFIED' : 'REJECTED',
                creditsAwarded: approved ? creditsAwarded : 0
            },
            include: {
                company: true,
                verifications: true
            }
        });

        res.json({
            action: updatedAction,
            verification,
            blockchainActionId: updatedAction.blockchainActionId || null // Include blockchain ID if available
        });
    }
);

// PATCH /api/actions/:id/blockchain - Update action with blockchain data
router.patch(
    '/:id/blockchain',
    authenticateToken,
    [
        body('blockchainActionId').optional().isInt({ min: 1 }),
        body('txHash').optional().isString(),
        body('blockNumber').optional().isInt({ min: 0 })
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const { id } = req.params;
        const { blockchainActionId, txHash, blockNumber } = req.body;

        // Get action
        const action = await prisma.action.findUnique({
            where: { id }
        });

        if (!action) {
            throw new AppError('Action not found', 404);
        }

        // Update with blockchain data
        const updatedAction = await prisma.action.update({
            where: { id },
            data: {
                ...(blockchainActionId !== undefined && { blockchainActionId: parseInt(blockchainActionId) }),
                ...(txHash && { txHash }),
                ...(blockNumber !== undefined && { blockNumber: parseInt(blockNumber) })
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

        res.json(updatedAction);
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
        const walletAddress = getAuthenticatedWallet(req);

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
