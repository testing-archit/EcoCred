import { Router } from 'express';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Helper function to calculate leaderboard
async function calculateLeaderboard(period: string = 'ALL_TIME') {
    const now = new Date();
    let startDate: Date | undefined;
    
    switch (period) {
        case 'DAILY':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'WEEKLY':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'MONTHLY':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'ALL_TIME':
        default:
            startDate = undefined;
            break;
    }
    
    // Get all companies with their stats
    const companies = await prisma.company.findMany({
        include: {
            actions: {
                where: startDate ? {
                    createdAt: { gte: startDate }
                } : {},
                select: {
                    status: true,
                    creditsAwarded: true
                }
            },
            earnedBadges: {
                where: startDate ? {
                    earnedAt: { gte: startDate }
                } : {}
            },
            _count: {
                select: {
                    actions: {
                        where: startDate ? {
                            createdAt: { gte: startDate }
                        } : {}
                    }
                }
            }
        }
    });
    
    // Calculate stats for each company
    const leaderboardData = companies.map(company => {
        const verifiedActions = company.actions.filter(a => a.status === 'VERIFIED');
        const totalCredits = verifiedActions.reduce((sum, a) => sum + a.creditsAwarded, 0);
        const totalActions = company._count.actions;
        const totalBadges = company.earnedBadges.length;
        
        return {
            companyId: company.id,
            company,
            totalCredits,
            totalActions,
            totalBadges
        };
    });
    
    // Sort by credits (descending)
    leaderboardData.sort((a, b) => b.totalCredits - a.totalCredits);
    
    // Assign ranks
    return leaderboardData.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        previousRank: null // Could be calculated from previous snapshots
    }));
}

// GET /api/leaderboard - Get leaderboard
router.get('/', async (req, res) => {
    const period = (req.query.period as string) || 'ALL_TIME';
    const limit = parseInt(req.query.limit as string) || 100;
    
    const leaderboard = await calculateLeaderboard(period);
    
    // Get top companies
    const topCompanies = leaderboard.slice(0, limit).map(entry => ({
        id: entry.company.id,
        name: entry.company.name,
        walletAddress: entry.company.walletAddress,
        verified: entry.company.verified,
        credits: entry.totalCredits,
        actions: entry.totalActions,
        badges: entry.totalBadges,
        rank: entry.rank,
        change: entry.previousRank 
            ? (entry.previousRank > entry.rank ? `+${entry.previousRank - entry.rank}` : entry.previousRank < entry.rank ? `${entry.previousRank - entry.rank}` : '0')
            : null
    }));
    
    res.json({
        period,
        leaderboard: topCompanies,
        total: leaderboard.length
    });
});

// GET /api/leaderboard/:companyId - Get company's leaderboard position
router.get('/:companyId', async (req, res) => {
    const { companyId } = req.params;
    const period = (req.query.period as string) || 'ALL_TIME';
    
    const leaderboard = await calculateLeaderboard(period);
    
    const companyEntry = leaderboard.find(entry => entry.companyId === companyId);
    
    if (!companyEntry) {
        throw new AppError('Company not found in leaderboard', 404);
    }
    
    res.json({
        companyId: companyEntry.company.id,
        name: companyEntry.company.name,
        credits: companyEntry.totalCredits,
        actions: companyEntry.totalActions,
        badges: companyEntry.totalBadges,
        rank: companyEntry.rank,
        totalParticipants: leaderboard.length
    });
});

export default router;

