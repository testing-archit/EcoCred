import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest, getAuthenticatedWallet } from '../middleware/auth.js';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/marketplace/listings - Get all active listings
router.get('/listings', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string || 'ACTIVE';
    const sellerId = req.query.sellerId as string;

    const where: any = { status: status as any };
    if (sellerId) {
        where.sellerId = sellerId;
    }

    const [listings, total] = await Promise.all([
        prisma.listing.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true,
                        verified: true
                    }
                }
            }
        }),
        prisma.listing.count({ where })
    ]);

    res.json({
        listings,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
});

// GET /api/marketplace/listings/:id - Get listing details
router.get('/listings/:id', async (req, res) => {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
            seller: {
                select: {
                    id: true,
                    name: true,
                    walletAddress: true,
                    verified: true
                }
            }
        }
    });

    if (!listing) {
        throw new AppError('Listing not found', 404);
    }

    res.json(listing);
});

// POST /api/marketplace/listings - Create new listing (authenticated)
router.post(
    '/listings',
    authenticateToken,
    [
        body('listingId').optional().isInt(),
        body('txHash').optional().isString()
    ],
    async (req: AuthRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        const { amount, pricePerCredit, totalPrice, listingId, txHash } = req.body;
        const walletAddress = getAuthenticatedWallet(req);

        const company = await prisma.company.findUnique({
            where: { walletAddress }
        });

        if (!company) {
            throw new AppError('Company not found', 404);
        }

        const listing = await prisma.listing.create({
            data: {
                sellerId: company.id,
                amount,
                pricePerCredit,
                totalPrice,
                status: 'ACTIVE',
                listingId,
                txHash
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true
                    }
                }
            }
        });

        res.status(201).json(listing);
    }
);

// PUT /api/marketplace/listings/:id/cancel - Cancel listing (authenticated)
router.put(
    '/listings/:id/cancel',
    authenticateToken,
    async (req: AuthRequest, res) => {
        const { id } = req.params;
        const walletAddress = getAuthenticatedWallet(req);

        const listing = await prisma.listing.findUnique({
            where: { id },
            include: { seller: true }
        });

        if (!listing) {
            throw new AppError('Listing not found', 404);
        }

        if (listing.seller.walletAddress !== walletAddress) {
            throw new AppError('Unauthorized', 403);
        }

        if (listing.status !== 'ACTIVE') {
            throw new AppError('Listing is not active', 400);
        }

        const updated = await prisma.listing.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        res.json(updated);
    }
);

export default router;
