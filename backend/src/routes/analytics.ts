import { Router } from 'express';
import prisma from '../database/client.js';

const router = Router();

// GET /api/analytics/overview - Platform statistics
router.get('/overview', async (req, res) => {
    const [
        totalCompanies,
        verifiedCompanies,
        totalActions,
        verifiedActions,
        pendingActions,
        totalStakes,
        totalListings,
        activeListings
    ] = await Promise.all([
        prisma.company.count(),
        prisma.company.count({ where: { verified: true } }),
        prisma.action.count(),
        prisma.action.count({ where: { status: 'VERIFIED' } }),
        prisma.action.count({ where: { status: 'PENDING' } }),
        prisma.stake.count(),
        prisma.listing.count(),
        prisma.listing.count({ where: { status: 'ACTIVE' } })
    ]);

    // Calculate total credits awarded
    const creditsResult = await prisma.action.aggregate({
        where: { status: 'VERIFIED' },
        _sum: { creditsAwarded: true }
    });

    const totalCreditsIssued = creditsResult._sum.creditsAwarded || 0;

    res.json({
        companies: {
            total: totalCompanies,
            verified: verifiedCompanies
        },
        actions: {
            total: totalActions,
            verified: verifiedActions,
            pending: pendingActions
        },
        credits: {
            totalIssued: totalCreditsIssued
        },
        staking: {
            totalStakes
        },
        marketplace: {
            totalListings,
            activeListings
        },
        timestamp: new Date().toISOString()
    });
});

// GET /api/analytics/companies/:id - Company-specific analytics
router.get('/companies/:id', async (req, res) => {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    actions: true,
                    listings: true,
                    stakes: true,
                    votes: true
                }
            }
        }
    });

    if (!company) {
        return res.status(404).json({ error: 'Company not found' });
    }

    // Get action breakdown by type
    const actionsByType = await prisma.action.groupBy({
        by: ['actionType', 'status'],
        where: { companyId: id },
        _count: true,
        _sum: { creditsAwarded: true }
    });

    // Get recent activity
    const recentActions = await prisma.action.findMany({
        where: { companyId: id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            actionType: true,
            description: true,
            status: true,
            creditsAwarded: true,
            createdAt: true
        }
    });

    // Calculate total credits earned
    const creditsResult = await prisma.action.aggregate({
        where: { companyId: id, status: 'VERIFIED' },
        _sum: { creditsAwarded: true }
    });

    res.json({
        company: {
            id: company.id,
            name: company.name,
            verified: company.verified,
            createdAt: company.createdAt
        },
        stats: {
            totalActions: company._count.actions,
            totalListings: company._count.listings,
            totalStakes: company._count.stakes,
            totalVotes: company._count.votes,
            totalCreditsEarned: creditsResult._sum.creditsAwarded || 0
        },
        actionsByType,
        recentActions
    });
});

// GET /api/analytics/trends - Historical trends
router.get('/trends', async (req, res) => {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get actions created per day
    const actions = await prisma.action.findMany({
        where: {
            createdAt: { gte: startDate }
        },
        select: {
            createdAt: true,
            status: true,
            creditsAwarded: true
        }
    });

    // Group by date
    const dailyStats = actions.reduce((acc, action) => {
        const date = action.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = {
                date,
                totalActions: 0,
                verifiedActions: 0,
                creditsIssued: 0
            };
        }
        acc[date].totalActions++;
        if (action.status === 'VERIFIED') {
            acc[date].verifiedActions++;
            acc[date].creditsIssued += action.creditsAwarded;
        }
        return acc;
    }, {} as Record<string, any>);

    const trends = Object.values(dailyStats).sort((a: any, b: any) =>
        a.date.localeCompare(b.date)
    );

    res.json({
        period: {
            days,
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString()
        },
        trends
    });
});

// GET /api/analytics/action-types - Action type distribution
router.get('/action-types', async (req, res) => {
    const actionTypes = await prisma.action.groupBy({
        by: ['actionType'],
        _count: true,
        _sum: { creditsAwarded: true },
        orderBy: { _count: { actionType: 'desc' } }
    });

    res.json({
        actionTypes: actionTypes.map(at => ({
            type: at.actionType,
            count: at._count,
            totalCredits: at._sum.creditsAwarded || 0
        }))
    });
});

export default router;
