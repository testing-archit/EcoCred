/**
 * Smart seed script that checks if tables are empty and seeds them with appropriate data
 * Only seeds tables that are empty to avoid overwriting existing data
 */

import {
    PrismaClient,
    ActionStatus,
    ListingStatus,
    BadgeTier,
    LeaderboardPeriod,
    AudienceScope,
    GuidelineCategory,
    SettingValueType,
    UserRole
} from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// Sample wallet addresses
const walletAddresses = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
    '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
    '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
    '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    '0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC',
    '0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9',
    '0x8ba1f109551bD432803012645Hac136c22C1779',
    '0x1234567890123456789012345678901234567890'
];

// Industries
const industries = [
    { name: 'Renewable Energy', description: 'Solar, wind, hydro and other renewable energy sources', icon: '⚡', color: '#22c55e' },
    { name: 'Manufacturing', description: 'Sustainable manufacturing and production', icon: '🏭', color: '#3b82f6' },
    { name: 'Environmental Conservation', description: 'Conservation and restoration of natural ecosystems', icon: '🌲', color: '#16a34a' },
    { name: 'Waste Management', description: 'Recycling, composting and waste reduction', icon: '♻️', color: '#eab308' },
    { name: 'Urban Planning', description: 'Green infrastructure and sustainable urban development', icon: '🏙️', color: '#8b5cf6' },
    { name: 'Agriculture', description: 'Sustainable farming and agriculture practices', icon: '🌾', color: '#84cc16' },
    { name: 'Transportation', description: 'Electric vehicles and sustainable transport', icon: '🚗', color: '#06b6d4' },
    { name: 'Construction', description: 'Green building and sustainable construction', icon: '🏗️', color: '#f97316' },
    { name: 'Technology', description: 'Clean technology and green IT solutions', icon: '💻', color: '#6366f1' },
    { name: 'Finance', description: 'Green finance and sustainable investments', icon: '💰', color: '#10b981' }
];

// Action Types
const actionTypes = [
    { type: 'reforestation', label: 'Reforestation & Tree Planting', description: 'Planting trees and restoring forests', unit: 'trees', minCreditsPerUnit: 50, maxCreditsPerUnit: 200, defaultCreditsPerUnit: 100 },
    { type: 'renewable_energy', label: 'Renewable Energy Installation', description: 'Installing solar, wind, or other renewable energy systems', unit: 'kW', minCreditsPerUnit: 100, maxCreditsPerUnit: 500, defaultCreditsPerUnit: 250 },
    { type: 'waste_reduction', label: 'Waste Reduction & Recycling', description: 'Reducing waste and implementing recycling programs', unit: 'tons', minCreditsPerUnit: 10, maxCreditsPerUnit: 100, defaultCreditsPerUnit: 50 },
    { type: 'energy_efficiency', label: 'Energy Efficiency Improvements', description: 'Improving energy efficiency in buildings and operations', unit: 'kWh saved', minCreditsPerUnit: 25, maxCreditsPerUnit: 150, defaultCreditsPerUnit: 75 },
    { type: 'water_conservation', label: 'Water Conservation', description: 'Conserving water and implementing water-saving measures', unit: '1000L saved', minCreditsPerUnit: 5, maxCreditsPerUnit: 50, defaultCreditsPerUnit: 20 },
    { type: 'sustainable_transport', label: 'Sustainable Transportation', description: 'Using or providing sustainable transportation solutions', unit: 'trips', minCreditsPerUnit: 20, maxCreditsPerUnit: 100, defaultCreditsPerUnit: 50 },
    { type: 'carbon_capture', label: 'Carbon Capture Technology', description: 'Implementing carbon capture and storage technologies', unit: 'tons', minCreditsPerUnit: 200, maxCreditsPerUnit: 1000, defaultCreditsPerUnit: 500 },
    { type: 'other', label: 'Other Sustainability Action', description: 'Other eco-friendly and sustainable actions', unit: 'units', minCreditsPerUnit: 10, maxCreditsPerUnit: 100, defaultCreditsPerUnit: 50 }
];

// Badge Definitions
const badgeDefinitions = [
    { name: 'Tree Planter', description: 'Planted 100+ trees', tier: BadgeTier.BRONZE, icon: 'TreePine', creditsRequired: 500, displayOrder: 1 },
    { name: 'Solar Pioneer', description: 'Installed renewable energy systems', tier: BadgeTier.GOLD, icon: 'Zap', creditsRequired: 1500, displayOrder: 2 },
    { name: 'Waste Warrior', description: 'Implemented comprehensive recycling program', tier: BadgeTier.SILVER, icon: 'Recycle', creditsRequired: 1000, displayOrder: 3 },
    { name: 'Carbon Neutral', description: 'Achieved net-zero carbon emissions', tier: BadgeTier.GOLD, icon: 'Shield', creditsRequired: 5000, displayOrder: 4 },
    { name: 'Eco Innovator', description: 'Developed sustainable technology solutions', tier: BadgeTier.PLATINUM, icon: 'Star', creditsRequired: 10000, displayOrder: 5 },
    { name: 'Green Leader', description: 'Led community sustainability initiatives', tier: BadgeTier.GOLD, icon: 'Trophy', creditsRequired: 3000, displayOrder: 6 },
    { name: 'Climate Champion', description: 'Made significant contributions to climate action', tier: BadgeTier.PLATINUM, icon: 'Award', creditsRequired: 15000, displayOrder: 7 },
    { name: 'Energy Efficient', description: 'Reduced energy consumption by 20% or more', tier: BadgeTier.SILVER, icon: 'Zap', creditsRequired: 750, displayOrder: 8 }
];

// Quick Actions
const quickActions = [
    { title: 'Log Eco Action', description: 'Record a new environmental action', icon: 'Leaf', route: '/actions', audience: AudienceScope.COMPANY, isPrimary: true, order: 1 },
    { title: 'Marketplace', description: 'Buy or sell carbon credits', icon: 'ShoppingBag', route: '/marketplace', audience: AudienceScope.COMPANY, isPrimary: false, order: 2 },
    { title: 'Stake Credits', description: 'Stake your credits for rewards', icon: 'Wallet', route: '/staking', audience: AudienceScope.COMPANY, isPrimary: false, order: 3 },
    { title: 'Leaderboard', description: 'View company rankings', icon: 'Trophy', route: '/leaderboard', audience: AudienceScope.COMPANY, isPrimary: false, order: 4 },
    { title: 'Review Actions', description: 'Review pending eco actions', icon: 'FileCheck', route: '/actions', audience: AudienceScope.VERIFIER, isPrimary: true, order: 1 },
    { title: 'Refresh Data', description: 'Reload dashboard data', icon: 'Activity', route: '#refresh', audience: AudienceScope.VERIFIER, isPrimary: false, order: 2 },
    { title: 'Analytics', description: 'View platform analytics', icon: 'TrendingUp', route: '/analytics', audience: AudienceScope.VERIFIER, isPrimary: false, order: 3 }
];

// Guidelines
const guidelines = [
    { title: 'Verify Evidence', description: 'Check all supporting documents and evidence submitted with each action', icon: 'CheckCircle2', category: GuidelineCategory.VERIFICATION, audience: AudienceScope.VERIFIER, displayOrder: 1 },
    { title: 'Assess Impact', description: 'Evaluate the actual environmental benefit and carbon reduction', icon: 'AlertCircle', category: GuidelineCategory.VERIFICATION, audience: AudienceScope.VERIFIER, displayOrder: 2 },
    { title: 'Data Accuracy', description: 'Ensure all submitted data is accurate and verifiable', icon: 'Database', category: GuidelineCategory.GENERAL, audience: AudienceScope.GLOBAL, displayOrder: 1 },
    { title: 'Timely Response', description: 'Respond to verification requests within 48 hours', icon: 'Clock', category: GuidelineCategory.GENERAL, audience: AudienceScope.GLOBAL, displayOrder: 2 }
];

// FAQs
const faqs = [
    { question: 'What is EcoCred?', answer: 'EcoCred is a blockchain-based platform for tracking, verifying, and trading carbon credits earned through environmental actions.', category: 'General', audience: AudienceScope.GLOBAL, displayOrder: 1 },
    { question: 'How do carbon credits work?', answer: 'Carbon credits represent a reduction in greenhouse gas emissions. Companies earn credits by performing verified eco-friendly actions, which can then be traded or retired.', category: 'General', audience: AudienceScope.GLOBAL, displayOrder: 2 },
    { question: 'How do I log an eco action?', answer: 'Navigate to the Actions page and click "Log New Action". Fill in the details about your environmental action and submit supporting documentation.', category: 'Actions', audience: AudienceScope.COMPANY, displayOrder: 1 }
];

// Platform Settings
const platformSettings = [
    { key: 'platform_name', label: 'Platform Name', value: 'EcoCred', valueType: SettingValueType.STRING, description: 'The name displayed across the platform' },
    { key: 'min_credits_for_listing', label: 'Minimum Credits for Listing', value: '100', valueType: SettingValueType.NUMBER, description: 'Minimum number of credits required to create a marketplace listing' },
    { key: 'verification_required_count', label: 'Verifications Required', value: '1', valueType: SettingValueType.NUMBER, description: 'Number of verifications required to approve an action' },
    { key: 'staking_enabled', label: 'Staking Enabled', value: 'true', valueType: SettingValueType.BOOLEAN, description: 'Whether staking feature is enabled' },
    { key: 'marketplace_fee_percent', label: 'Marketplace Fee %', value: '2.5', valueType: SettingValueType.NUMBER, description: 'Percentage fee charged on marketplace transactions' }
];

// Companies
const companies = [
    { walletAddress: walletAddresses[0], name: 'GreenTech Solutions', description: 'Leading provider of renewable energy solutions', industry: 'Renewable Energy', website: 'https://greentech.example.com', location: 'San Francisco, CA', verified: true },
    { walletAddress: walletAddresses[1], name: 'EcoManufacturing Inc', description: 'Sustainable manufacturing with zero-waste production', industry: 'Manufacturing', website: 'https://ecomanufacturing.example.com', location: 'Portland, OR', verified: true },
    { walletAddress: walletAddresses[2], name: 'Forest Guardians', description: 'Reforestation and forest conservation organization', industry: 'Environmental Conservation', website: 'https://forestguardians.example.com', location: 'Seattle, WA', verified: true },
    { walletAddress: walletAddresses[3], name: 'CleanOcean Initiative', description: 'Ocean cleanup and marine ecosystem restoration', industry: 'Environmental Conservation', website: 'https://cleanocean.example.com', location: 'Miami, FL', verified: true }
];

async function checkAndSeed() {
    console.log('🔍 Checking database tables...\n');

    try {
        // Check and seed Industries
        const industryCount = await prisma.industry.count();
        if (industryCount === 0) {
            console.log('🏭 Seeding industries...');
            for (const industry of industries) {
                await prisma.industry.upsert({
                    where: { name: industry.name },
                    update: industry,
                    create: industry
                });
            }
            console.log(`✅ Seeded ${industries.length} industries\n`);
        } else {
            console.log(`⏭️  Industries already have ${industryCount} records, skipping...\n`);
        }

        // Check and seed Action Types
        const actionTypeCount = await prisma.actionType.count();
        if (actionTypeCount === 0) {
            console.log('⚙️  Seeding action types...');
            for (const actionType of actionTypes) {
                await prisma.actionType.upsert({
                    where: { type: actionType.type },
                    update: actionType,
                    create: { ...actionType, active: true }
                });
            }
            console.log(`✅ Seeded ${actionTypes.length} action types\n`);
        } else {
            console.log(`⏭️  Action types already have ${actionTypeCount} records, skipping...\n`);
        }

        // Check and seed Badge Definitions
        const badgeCount = await prisma.badgeDefinition.count();
        if (badgeCount === 0) {
            console.log('🏆 Seeding badge definitions...');
            for (const badge of badgeDefinitions) {
                const existing = await prisma.badgeDefinition.findFirst({
                    where: { name: badge.name }
                });
                if (existing) {
                    await prisma.badgeDefinition.update({
                        where: { id: existing.id },
                        data: { ...badge, active: true }
                    });
                } else {
                    await prisma.badgeDefinition.create({
                        data: { ...badge, active: true }
                    });
                }
            }
            console.log(`✅ Seeded ${badgeDefinitions.length} badge definitions\n`);
        } else {
            console.log(`⏭️  Badge definitions already have ${badgeCount} records, skipping...\n`);
        }

        // Check and seed Quick Actions
        const quickActionCount = await prisma.quickAction.count();
        if (quickActionCount === 0) {
            console.log('⚡ Seeding quick actions...');
            for (const action of quickActions) {
                await prisma.quickAction.create({ data: { ...action, isActive: true } });
            }
            console.log(`✅ Seeded ${quickActions.length} quick actions\n`);
        } else {
            console.log(`⏭️  Quick actions already have ${quickActionCount} records, skipping...\n`);
        }

        // Check and seed Guidelines
        const guidelineCount = await prisma.guideline.count();
        if (guidelineCount === 0) {
            console.log('📋 Seeding guidelines...');
            for (const guideline of guidelines) {
                await prisma.guideline.create({ data: { ...guideline, isActive: true } });
            }
            console.log(`✅ Seeded ${guidelines.length} guidelines\n`);
        } else {
            console.log(`⏭️  Guidelines already have ${guidelineCount} records, skipping...\n`);
        }

        // Check and seed FAQs
        const faqCount = await prisma.faq.count();
        if (faqCount === 0) {
            console.log('❓ Seeding FAQs...');
            for (const faq of faqs) {
                await prisma.faq.create({ data: { ...faq, isActive: true } });
            }
            console.log(`✅ Seeded ${faqs.length} FAQs\n`);
        } else {
            console.log(`⏭️  FAQs already have ${faqCount} records, skipping...\n`);
        }

        // Check and seed Platform Settings
        const settingCount = await prisma.platformSetting.count();
        if (settingCount === 0) {
            console.log('⚙️  Seeding platform settings...');
            for (const setting of platformSettings) {
                await prisma.platformSetting.upsert({
                    where: { key: setting.key },
                    update: setting,
                    create: setting
                });
            }
            console.log(`✅ Seeded ${platformSettings.length} platform settings\n`);
        } else {
            console.log(`⏭️  Platform settings already have ${settingCount} records, skipping...\n`);
        }

        // Check and seed Companies (only if empty)
        const companyCount = await prisma.company.count();
        if (companyCount === 0) {
            console.log('🏢 Seeding companies...');

            type CreatedCompany = {
                id: string;
                name: string;
                walletAddress: string;
                [key: string]: unknown;
            };
            const createdCompanies: CreatedCompany[] = [];

            for (const company of companies) {
                // Find or create industry
                let industryRecord = await prisma.industry.findFirst({
                    where: { name: company.industry }
                });
                if (!industryRecord) {
                    industryRecord = await prisma.industry.create({
                        data: {
                            name: company.industry,
                            description: `${company.industry} industry`,
                            icon: '🏢',
                            color: '#64748b'
                        }
                    });
                }

                const created = await prisma.company.create({
                    data: {
                        walletAddress: company.walletAddress,
                        name: company.name,
                        description: company.description,
                        website: company.website,
                        location: company.location,
                        verified: company.verified,
                        industryId: industryRecord.id
                    }
                });
                createdCompanies.push(created);
                console.log(`   ✓ ${created.name}`);
            }
            console.log(`✅ Seeded ${createdCompanies.length} companies\n`);

            // Seed some actions for companies
            const actionTypeRecords = await prisma.actionType.findMany();
            if (actionTypeRecords.length > 0) {
                console.log('🌱 Seeding sample actions...');
                const sampleActions = [
                    { companyIndex: 0, actionType: 'reforestation', description: 'Planted 1,000 trees in reforestation project', quantity: 1000, unit: 'trees', status: ActionStatus.VERIFIED, creditsAwarded: 100000 },
                    { companyIndex: 0, actionType: 'renewable_energy', description: 'Installed 500kW solar panel system', quantity: 500, unit: 'kW', status: ActionStatus.VERIFIED, creditsAwarded: 125000 },
                    { companyIndex: 1, actionType: 'waste_reduction', description: 'Recycled 10,000 tons of industrial waste', quantity: 10000, unit: 'tons', status: ActionStatus.VERIFIED, creditsAwarded: 500000 },
                    { companyIndex: 2, actionType: 'reforestation', description: 'Planted 5,000 native trees', quantity: 5000, unit: 'trees', status: ActionStatus.PENDING, creditsAwarded: 0 },
                    { companyIndex: 3, actionType: 'carbon_capture', description: 'Captured 50 tons of CO2', quantity: 50, unit: 'tons', status: ActionStatus.VERIFIED, creditsAwarded: 25000 }
                ];

                for (const action of sampleActions) {
                    const company = createdCompanies[action.companyIndex];
                    const actionType = actionTypeRecords.find(at => at.type === action.actionType);
                    if (company && actionType) {
                        await prisma.action.create({
                            data: {
                                companyId: company.id,
                                actionType: action.actionType,
                                description: action.description,
                                quantity: action.quantity,
                                unit: action.unit,
                                status: action.status,
                                creditsAwarded: action.creditsAwarded
                            }
                        });
                    }
                }
                console.log(`✅ Seeded ${sampleActions.length} sample actions\n`);
            }
        } else {
            console.log(`⏭️  Companies already have ${companyCount} records, skipping...\n`);
        }

        // Check and seed Earned Badges
        const earnedBadgeCount = await prisma.earnedBadge.count();
        if (earnedBadgeCount === 0) {
            console.log('🏅 Seeding earned badges...');
            const allCompanies = await prisma.company.findMany();
            const allBadges = await prisma.badgeDefinition.findMany({ where: { active: true } });

            if (allCompanies.length > 0 && allBadges.length > 0) {
                // Get total credits per company from actions
                const companiesWithCredits = await prisma.company.findMany({
                    include: {
                        actions: {
                            where: { status: ActionStatus.VERIFIED }
                        }
                    }
                });

                let seededCount = 0;
                for (const company of companiesWithCredits) {
                    const totalCredits = company.actions.reduce((sum, action) => sum + action.creditsAwarded, 0);

                    // Award badges based on credits earned
                    for (const badge of allBadges) {
                        if (totalCredits >= badge.creditsRequired) {
                            // Check if badge already earned
                            const existing = await prisma.earnedBadge.findUnique({
                                where: {
                                    badgeId_companyId: {
                                        badgeId: badge.id,
                                        companyId: company.id
                                    }
                                }
                            });

                            if (!existing) {
                                await prisma.earnedBadge.create({
                                    data: {
                                        badgeId: badge.id,
                                        companyId: company.id,
                                        tokenId: null, // Would be set when minted on blockchain
                                        txHash: null,
                                        earnedAt: new Date()
                                    }
                                });
                                seededCount++;
                                console.log(`   ✓ ${company.name} earned badge: ${badge.name}`);
                            }
                        }
                    }
                }
                console.log(`✅ Seeded ${seededCount} earned badges\n`);
            } else {
                console.log('⚠️  No companies or badges found, skipping earned badges...\n');
            }
        } else {
            console.log(`⏭️  Earned badges already have ${earnedBadgeCount} records, skipping...\n`);
        }

        // Check and seed Leaderboard
        const leaderboardCount = await prisma.leaderboard.count();
        if (leaderboardCount === 0) {
            console.log('🏆 Seeding leaderboard...');
            const allCompanies = await prisma.company.findMany({
                include: {
                    actions: {
                        where: { status: ActionStatus.VERIFIED }
                    },
                    earnedBadges: true
                }
            });

            if (allCompanies.length > 0) {
                // Calculate credits, actions, and badges for each company
                const companyStats = allCompanies.map(company => {
                    const totalCredits = company.actions.reduce((sum, action) => sum + action.creditsAwarded, 0);
                    const totalActions = company.actions.length;
                    const totalBadges = company.earnedBadges.length;
                    return {
                        company,
                        totalCredits,
                        totalActions,
                        totalBadges
                    };
                });

                // Sort by total credits (descending)
                companyStats.sort((a, b) => b.totalCredits - a.totalCredits);

                // Create leaderboard entries for ALL_TIME period
                for (let i = 0; i < companyStats.length; i++) {
                    const stat = companyStats[i];
                    const rank = i + 1;

                    await prisma.leaderboard.create({
                        data: {
                            companyId: stat.company.id,
                            totalCredits: stat.totalCredits,
                            totalActions: stat.totalActions,
                            totalBadges: stat.totalBadges,
                            rank: rank,
                            previousRank: null,
                            period: LeaderboardPeriod.ALL_TIME,
                            snapshotDate: new Date()
                        }
                    });
                    console.log(`   ✓ Rank ${rank}: ${stat.company.name} (${stat.totalCredits.toLocaleString()} credits)`);
                }

                // Also create monthly leaderboard
                console.log('   Creating monthly leaderboard...');
                const monthlyStats = [...companyStats];
                monthlyStats.sort((a, b) => b.totalCredits - a.totalCredits);

                for (let i = 0; i < monthlyStats.length; i++) {
                    const stat = monthlyStats[i];
                    const rank = i + 1;

                    await prisma.leaderboard.create({
                        data: {
                            companyId: stat.company.id,
                            totalCredits: stat.totalCredits,
                            totalActions: stat.totalActions,
                            totalBadges: stat.totalBadges,
                            rank: rank,
                            previousRank: null,
                            period: LeaderboardPeriod.MONTHLY,
                            snapshotDate: new Date()
                        }
                    });
                }

                console.log(`✅ Seeded ${companyStats.length * 2} leaderboard entries (ALL_TIME + MONTHLY)\n`);
            } else {
                console.log('⚠️  No companies found, skipping leaderboard...\n');
            }
        } else {
            console.log(`⏭️  Leaderboard already have ${leaderboardCount} records, skipping...\n`);
        }

        // Summary
        console.log('📊 Database Status Summary:');
        console.log('─────────────────────────────');
        const counts = {
            industries: await prisma.industry.count(),
            actionTypes: await prisma.actionType.count(),
            badgeDefinitions: await prisma.badgeDefinition.count(),
            quickActions: await prisma.quickAction.count(),
            guidelines: await prisma.guideline.count(),
            faqs: await prisma.faq.count(),
            platformSettings: await prisma.platformSetting.count(),
            companies: await prisma.company.count(),
            actions: await prisma.action.count(),
            verifications: await prisma.verification.count(),
            listings: await prisma.listing.count(),
            stakes: await prisma.stake.count(),
            votes: await prisma.vote.count(),
            earnedBadges: await prisma.earnedBadge.count(),
            leaderboard: await prisma.leaderboard.count(),
            analytics: await prisma.analytics.count(),
            users: await prisma.user.count()
        };

        for (const [table, count] of Object.entries(counts)) {
            console.log(`${table.padEnd(20)}: ${count}`);
        }
        console.log('─────────────────────────────\n');
        console.log('✅ Database check and seed complete! 🎉\n');

    } catch (error) {
        console.error('❌ Error checking/seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

checkAndSeed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

