import {
    PrismaClient,
    ActionStatus,
    ListingStatus,
    BadgeTier,
    LeaderboardPeriod,
    BadgeDefinition,
    Company,
    Action as PrismaAction,
    Listing,
    Stake,
    Vote
} from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get random element from array
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Helper to get random integer between min and max
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
// Helper to get random float string
const randomFloatStr = (min: number, max: number, decimals: number = 2): string => (Math.random() * (max - min) + min).toFixed(decimals);

// Data pools
const industries = ['Renewable Energy', 'Manufacturing', 'Environmental Conservation', 'Waste Management', 'Urban Planning', 'Agriculture', 'Transportation', 'Technology'];
const locations = ['San Francisco, CA', 'Portland, OR', 'Seattle, WA', 'Miami, FL', 'Austin, TX', 'Denver, CO', 'Chicago, IL', 'New York, NY', 'London, UK', 'Berlin, DE', 'Tokyo, JP', 'Toronto, CA'];
const companyPrefixes = ['Green', 'Eco', 'Clean', 'Sustainable', 'Future', 'Nature', 'Earth', 'Blue', 'Solar', 'Wind'];
const companySuffixes = ['Solutions', 'Inc', 'Corp', 'Partners', 'Group', 'Technologies', 'Systems', 'Innovations', 'Labs', 'Ventures'];

const actionTypes = [
    { type: 'tree_planting', unit: 'trees', creditPerUnit: 10, verbs: ['Planted', 'Restored', 'Seeded'] },
    { type: 'solar_installation', unit: 'kW', creditPerUnit: 50, verbs: ['Installed', 'Deployed', 'Setup'] },
    { type: 'recycling', unit: 'kg', creditPerUnit: 2, verbs: ['Recycled', 'Processed', 'Recovered'] },
    { type: 'renewable_energy', unit: 'kWh', creditPerUnit: 1, verbs: ['Generated', 'Produced', 'Supplied'] },
    { type: 'carbon_capture', unit: 'tons', creditPerUnit: 100, verbs: ['Captured', 'Sequestered', 'Stored'] },
    { type: 'ocean_cleanup', unit: 'kg', creditPerUnit: 5, verbs: ['Removed', 'Cleaned', 'Collected'] },
    { type: 'energy_efficiency', unit: 'kWh saved', creditPerUnit: 3, verbs: ['Saved', 'Reduced', 'Conserved'] },
    { type: 'composting', unit: 'kg', creditPerUnit: 1, verbs: ['Composted', 'Converted', 'Transformed'] }
];

async function seed() {
    console.log('🌱 Starting extended database seed...\n');

    try {
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await prisma.vote.deleteMany();
        await prisma.stake.deleteMany();
        await prisma.listing.deleteMany();
        await prisma.verification.deleteMany();
        await prisma.document.deleteMany();
        await prisma.action.deleteMany();
        await prisma.earnedBadge.deleteMany();
        await prisma.leaderboard.deleteMany();
        await prisma.company.deleteMany();
        await prisma.badgeDefinition.deleteMany();
        await prisma.actionType.deleteMany();
        console.log('✅ Existing data cleared\n');

        // 1. Create Action Types
        console.log('⚙️  Creating action types...');
        for (const at of actionTypes) {
            await prisma.actionType.create({
                data: {
                    type: at.type,
                    label: at.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    description: `Standard ${at.type.replace('_', ' ')} activities`,
                    unit: at.unit,
                    defaultCreditsPerUnit: at.creditPerUnit,
                    active: true
                }
            });
        }
        console.log(`✅ Created ${actionTypes.length} action types\n`);

        // 2. Create Badge Definitions
        console.log('🏅 Creating badge definitions...');
        const badgeDefinitions = [
            { name: 'Eco Starter', description: 'Completed first eco action', tier: BadgeTier.BRONZE, creditsRequired: 100, icon: 'sprout' },
            { name: 'Green Guardian', description: 'Verified 10 actions', tier: BadgeTier.SILVER, creditsRequired: 1000, icon: 'shield-check' },
            { name: 'Carbon Neutral', description: 'Offset 100 tons of CO2', tier: BadgeTier.GOLD, creditsRequired: 10000, icon: 'leaf' },
            { name: 'Planet Savior', description: 'Top 1% contributor', tier: BadgeTier.PLATINUM, creditsRequired: 100000, icon: 'globe' },
            { name: 'Solar Pioneer', description: 'Generated 1MW of solar energy', tier: BadgeTier.GOLD, creditsRequired: 5000, icon: 'sun' },
            { name: 'Ocean Defender', description: 'Cleaned 1 ton of ocean waste', tier: BadgeTier.SILVER, creditsRequired: 2000, icon: 'water' }
        ];

        const createdBadges: BadgeDefinition[] = [];
        for (const badge of badgeDefinitions) {
            const created = await prisma.badgeDefinition.create({
                data: {
                    ...badge,
                    active: true
                }
            });
            createdBadges.push(created);
        }
        console.log(`✅ Created ${createdBadges.length} badge definitions\n`);

        // 3. Create Companies (~30)
        console.log('🏢 Creating companies...');
        const createdCompanies: Company[] = [];
        const targetCompanyCount = 30;

        for (let i = 0; i < targetCompanyCount; i++) {
            const name = `${random(companyPrefixes)}${random(companySuffixes)} ${randomInt(1, 99)}`;
            const walletAddress = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

            const created = await prisma.company.create({
                data: {
                    walletAddress,
                    name,
                    description: `A leading company in ${random(industries)} focused on sustainability.`,
                    industry: random(industries),
                    website: `https://${name.toLowerCase().replace(/ /g, '-')}.example.com`,
                    location: random(locations),
                    verified: Math.random() > 0.3 // 70% verified
                }
            });
            createdCompanies.push(created);
        }
        console.log(`✅ Created ${createdCompanies.length} companies\n`);

        // 4. Create Actions (~30-50)
        console.log('🌱 Creating eco actions...');
        const createdActions: PrismaAction[] = [];
        const targetActionCount = 45; // A bit more than 30 to ensure coverage

        for (let i = 0; i < targetActionCount; i++) {
            const company = random(createdCompanies);
            const actionType = random(actionTypes);
            const quantity = randomInt(10, 1000);
            const credits = quantity * actionType.creditPerUnit;
            const status = Math.random() > 0.2 ? ActionStatus.VERIFIED : (Math.random() > 0.5 ? ActionStatus.PENDING : ActionStatus.PROCESSING);

            const created = await prisma.action.create({
                data: {
                    companyId: company.id,
                    actionType: actionType.type,
                    description: `${random(actionType.verbs)} ${quantity} ${actionType.unit} for sustainability project.`,
                    quantity: quantity,
                    unit: actionType.unit,
                    status: status,
                    creditsAwarded: status === ActionStatus.VERIFIED ? credits : 0,
                    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Last 60 days
                    txHash: status === ActionStatus.VERIFIED ? `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}` : null
                }
            });
            createdActions.push(created);
        }
        console.log(`✅ Created ${createdActions.length} actions\n`);

        // 5. Create Verifications (for verified actions)
        console.log('✔️  Creating verifications...');
        let verificationCount = 0;
        for (const action of createdActions) {
            if (action.status === ActionStatus.VERIFIED) {
                const verifier = random(createdCompanies.filter(c => c.id !== action.companyId && c.verified));
                if (verifier) {
                    await prisma.verification.create({
                        data: {
                            actionId: action.id,
                            verifierId: verifier.id,
                            approved: true,
                            comments: 'Verified compliance with environmental standards.',
                            createdAt: new Date(action.createdAt.getTime() + randomInt(1, 72) * 60 * 60 * 1000),
                            txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
                        }
                    });
                    verificationCount++;
                }
            }
        }
        console.log(`✅ Created ${verificationCount} verifications\n`);

        // 6. Create Listings (~30)
        console.log('🛒 Creating marketplace listings...');
        const targetListingCount = 30;
        const listings: Listing[] = [];

        for (let i = 0; i < targetListingCount; i++) {
            const seller = random(createdCompanies);
            const amount = randomInt(100, 5000);
            const pricePerCredit = randomFloatStr(0.02, 0.10, 3);
            const totalPrice = (amount * parseFloat(pricePerCredit)).toFixed(2);
            const status = Math.random() > 0.7 ? ListingStatus.SOLD : ListingStatus.ACTIVE;

            const listing = await prisma.listing.create({
                data: {
                    sellerId: seller.id,
                    amount,
                    pricePerCredit,
                    totalPrice,
                    status,
                    buyerAddress: status === ListingStatus.SOLD ? random(createdCompanies).walletAddress : null,
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
                }
            });
            listings.push(listing);
        }
        console.log(`✅ Created ${listings.length} listings\n`);

        // 7. Create Stakes (~30)
        console.log('💰 Creating stakes...');
        const targetStakeCount = 30;
        const stakes: Stake[] = [];

        for (let i = 0; i < targetStakeCount; i++) {
            const staker = random(createdCompanies);
            const amount = randomInt(1000, 50000);
            const durationDays = random([30, 60, 90, 180, 365]);
            const isPast = Math.random() > 0.5;
            const startTime = isPast
                ? new Date(Date.now() - (durationDays + 10) * 24 * 60 * 60 * 1000)
                : new Date(Date.now() - randomInt(1, 20) * 24 * 60 * 60 * 1000);
            const endTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
            const claimed = isPast && Math.random() > 0.2;

            const stake = await prisma.stake.create({
                data: {
                    stakerId: staker.id,
                    amount,
                    duration: durationDays * 24 * 60 * 60,
                    startTime,
                    endTime,
                    claimed,
                    rewardAmount: Math.floor(amount * (durationDays / 365) * 0.10), // 10% APY approx
                    txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
                }
            });
            stakes.push(stake);
        }
        console.log(`✅ Created ${stakes.length} stakes\n`);

        // 8. Create Votes (~30)
        console.log('🗳️  Creating governance votes...');
        const targetVoteCount = 35;
        const votes: Vote[] = [];

        for (let i = 0; i < targetVoteCount; i++) {
            const voter = random(createdCompanies);
            const proposalId = randomInt(1, 5);

            // Ensure unique voter per proposal
            const existingVote = votes.find(v => v.voterId === voter.id && v.proposalId === proposalId);
            if (existingVote) continue;

            const vote = await prisma.vote.create({
                data: {
                    proposalId,
                    voterId: voter.id,
                    support: Math.random() > 0.3,
                    votingPower: randomInt(1000, 100000),
                    txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                    createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
                }
            });
            votes.push(vote);
        }
        console.log(`✅ Created ${votes.length} votes\n`);

        // 9. Earned Badges
        console.log('🏆 Awarding badges...');
        let badgeCount = 0;
        for (const company of createdCompanies) {
            // Give random badges to companies
            const numBadges = randomInt(0, 3);
            const shuffledBadges = [...createdBadges].sort(() => 0.5 - Math.random());
            const selectedBadges = shuffledBadges.slice(0, numBadges);

            for (const badge of selectedBadges) {
                await prisma.earnedBadge.create({
                    data: {
                        badgeId: badge.id,
                        companyId: company.id,
                        tokenId: randomInt(1000, 99999),
                        txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                        earnedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
                    }
                });
                badgeCount++;
            }
        }
        console.log(`✅ Awarded ${badgeCount} badges\n`);

        // 10. Leaderboard
        console.log('📊 Generating leaderboard...');
        for (const company of createdCompanies) {
            // Calculate stats
            const companyActions = createdActions.filter(a => a.companyId === company.id && a.status === ActionStatus.VERIFIED);
            const totalCredits = companyActions.reduce((sum, a) => sum + a.creditsAwarded, 0);

            if (totalCredits > 0) {
                await prisma.leaderboard.create({
                    data: {
                        companyId: company.id,
                        totalCredits,
                        totalActions: companyActions.length,
                        totalBadges: randomInt(0, 5),
                        rank: 0, // Will need recalculation but fine for seed
                        period: LeaderboardPeriod.ALL_TIME,
                        snapshotDate: new Date()
                    }
                });
            }
        }
        console.log('✅ Leaderboard generated\n');

        // 11. Analytics Snapshot
        console.log('📈 Creating analytics snapshot...');
        await prisma.analytics.create({
            data: {
                totalCompanies: createdCompanies.length,
                totalActions: createdActions.length,
                totalCreditsIssued: createdActions.reduce((sum, a) => sum + a.creditsAwarded, 0),
                totalBadgesMinted: badgeCount,
                totalStaked: stakes.reduce((sum, s) => sum + s.amount, 0),
                totalMarketVolume: listings.reduce((sum, l) => sum + parseFloat(l.totalPrice), 0).toFixed(2),
                snapshotDate: new Date()
            }
        });
        console.log('✅ Analytics snapshot created\n');

        console.log('🎉 Database seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
