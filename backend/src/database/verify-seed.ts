import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySeed() {
    console.log('🔍 Verifying database seed...\n');

    try {
        const companies = await prisma.company.count();
        const actions = await prisma.action.count();
        const verifications = await prisma.verification.count();
        const listings = await prisma.listing.count();
        const stakes = await prisma.stake.count();
        const votes = await prisma.vote.count();
        const earnedBadges = await prisma.earnedBadge.count();
        const badgeDefinitions = await prisma.badgeDefinition.count();
        const actionTypes = await prisma.actionType.count();
        const leaderboard = await prisma.leaderboard.count();
        const analytics = await prisma.analytics.count();

        console.log('📊 Database Record Counts:');
        console.log('─────────────────────────────');
        console.log(`Companies:          ${companies}`);
        console.log(`Actions:            ${actions}`);
        console.log(`Verifications:      ${verifications}`);
        console.log(`Listings:           ${listings}`);
        console.log(`Stakes:             ${stakes}`);
        console.log(`Votes:              ${votes}`);
        console.log(`Earned Badges:      ${earnedBadges}`);
        console.log(`Badge Definitions:  ${badgeDefinitions}`);
        console.log(`Action Types:       ${actionTypes}`);
        console.log(`Leaderboard:        ${leaderboard}`);
        console.log(`Analytics:          ${analytics}`);
        console.log('─────────────────────────────');
        console.log('\n✅ Verification complete!\n');

    } catch (error) {
        console.error('❌ Error verifying database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

verifySeed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
