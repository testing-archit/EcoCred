import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/action-types - Get all action types
router.get('/', async (req, res) => {
    const activeOnly = req.query.active === 'true';
    
    const where = activeOnly ? { active: true } : {};
    
    const actionTypes = await prisma.actionType.findMany({
        where,
        orderBy: { label: 'asc' }
    });
    
    // Transform for frontend compatibility - map label to name, defaultCreditsPerUnit to baseCredits
    const transformedTypes = actionTypes.map(type => ({
        ...type,
        name: type.label, // Map label to name for frontend
        baseCredits: type.defaultCreditsPerUnit // Map defaultCreditsPerUnit to baseCredits
    }));
    
    res.json({ actionTypes: transformedTypes });
});

// GET /api/action-types/:id - Get action type by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    const actionType = await prisma.actionType.findUnique({
        where: { id }
    });
    
    if (!actionType) {
        throw new AppError('Action type not found', 404);
    }
    
    res.json(actionType);
});

// POST /api/action-types - Create action type (admin only)
router.post(
    '/',
    authenticateToken,
    [
        body('type').isString().trim().notEmpty(),
        body('label').isString().trim().notEmpty(),
        body('unit').isString().trim().notEmpty(),
        body('minCreditsPerUnit').optional().isInt({ min: 0 }),
        body('maxCreditsPerUnit').optional().isInt({ min: 0 }),
        body('defaultCreditsPerUnit').optional().isInt({ min: 0 }),
    ],
    async (req: AuthRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }
        
        const {
            type,
            label,
            description,
            unit,
            minCreditsPerUnit = 0,
            maxCreditsPerUnit = 0,
            defaultCreditsPerUnit = 0,
            active = true
        } = req.body;
        
        // Check if type already exists
        const existing = await prisma.actionType.findUnique({
            where: { type }
        });
        
        if (existing) {
            throw new AppError('Action type already exists', 400);
        }
        
        const actionType = await prisma.actionType.create({
            data: {
                type,
                label,
                description,
                unit,
                minCreditsPerUnit,
                maxCreditsPerUnit,
                defaultCreditsPerUnit,
                active
            }
        });
        
        res.status(201).json(actionType);
    }
);

// PUT /api/action-types/:id - Update action type (admin only)
router.put(
    '/:id',
    authenticateToken,
    [
        body('label').optional().isString().trim().notEmpty(),
        body('unit').optional().isString().trim().notEmpty(),
        body('minCreditsPerUnit').optional().isInt({ min: 0 }),
        body('maxCreditsPerUnit').optional().isInt({ min: 0 }),
        body('defaultCreditsPerUnit').optional().isInt({ min: 0 }),
    ],
    async (req: AuthRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }
        
        const { id } = req.params;
        
        const actionType = await prisma.actionType.findUnique({
            where: { id }
        });
        
        if (!actionType) {
            throw new AppError('Action type not found', 404);
        }
        
        const updated = await prisma.actionType.update({
            where: { id },
            data: req.body
        });
        
        res.json(updated);
    }
);

export default router;

