import { PrismaClient, AudienceScope, GuidelineCategory, SettingValueType } from '@prisma/client';

const prisma = new PrismaClient();

// Industries that companies can belong to
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
    { name: 'Finance', description: 'Green finance and sustainable investments', icon: '💰', color: '#10b981' },
    { name: 'Retail', description: 'Sustainable retail and eco-friendly products', icon: '🛍️', color: '#ec4899' },
    { name: 'Healthcare', description: 'Sustainable healthcare practices', icon: '🏥', color: '#ef4444' },
    { name: 'Education', description: 'Environmental education and awareness', icon: '📚', color: '#0ea5e9' },
    { name: 'Hospitality', description: 'Eco-friendly hotels and tourism', icon: '🏨', color: '#a855f7' },
    { name: 'Other', description: 'Other industries committed to sustainability', icon: '🌍', color: '#64748b' }
];

// Quick actions for different dashboard types
const quickActions = [
    // Company quick actions
    { title: 'Log Eco Action', description: 'Record a new environmental action', icon: 'Leaf', route: '/actions', audience: 'COMPANY' as AudienceScope, isPrimary: true, order: 1 },
    { title: 'Marketplace', description: 'Buy or sell carbon credits', icon: 'ShoppingBag', route: '/marketplace', audience: 'COMPANY' as AudienceScope, isPrimary: false, order: 2 },
    { title: 'Stake Credits', description: 'Stake your credits for rewards', icon: 'Wallet', route: '/staking', audience: 'COMPANY' as AudienceScope, isPrimary: false, order: 3 },
    { title: 'Leaderboard', description: 'View company rankings', icon: 'Trophy', route: '/leaderboard', audience: 'COMPANY' as AudienceScope, isPrimary: false, order: 4 },
    
    // Verifier quick actions
    { title: 'Review Actions', description: 'Review pending eco actions', icon: 'FileCheck', route: '/actions', audience: 'VERIFIER' as AudienceScope, isPrimary: true, order: 1 },
    { title: 'Refresh Data', description: 'Reload dashboard data', icon: 'Activity', route: '#refresh', audience: 'VERIFIER' as AudienceScope, isPrimary: false, order: 2 },
    { title: 'Analytics', description: 'View platform analytics', icon: 'TrendingUp', route: '/analytics', audience: 'VERIFIER' as AudienceScope, isPrimary: false, order: 3 },
    
    // Auditor quick actions
    { title: 'Audit Companies', description: 'Review company profiles', icon: 'Search', route: '/companies', audience: 'AUDITOR' as AudienceScope, isPrimary: true, order: 1 },
    { title: 'Review Actions', description: 'Audit eco actions', icon: 'FileText', route: '/actions', audience: 'AUDITOR' as AudienceScope, isPrimary: false, order: 2 },
    { title: 'Platform Analytics', description: 'View platform insights', icon: 'TrendingUp', route: '/analytics', audience: 'AUDITOR' as AudienceScope, isPrimary: false, order: 3 },
    { title: 'Governance', description: 'Participate in governance', icon: 'Shield', route: '/governance', audience: 'AUDITOR' as AudienceScope, isPrimary: false, order: 4 },
    
    // Admin quick actions
    { title: 'Manage Companies', description: 'Oversee all companies', icon: 'Users', route: '/companies', audience: 'ADMIN' as AudienceScope, isPrimary: true, order: 1 },
    { title: 'Review Actions', description: 'Review all eco actions', icon: 'FileCheck', route: '/actions', audience: 'ADMIN' as AudienceScope, isPrimary: false, order: 2 },
    { title: 'Platform Analytics', description: 'View analytics dashboard', icon: 'TrendingUp', route: '/analytics', audience: 'ADMIN' as AudienceScope, isPrimary: false, order: 3 },
    { title: 'Refresh Data', description: 'Reload dashboard data', icon: 'Activity', route: '#refresh', audience: 'ADMIN' as AudienceScope, isPrimary: false, order: 4 }
];

// Guidelines for different roles
const guidelines = [
    // Verifier guidelines
    { title: 'Verify Evidence', description: 'Check all supporting documents and evidence submitted with each action', icon: 'CheckCircle2', category: 'VERIFICATION' as GuidelineCategory, audience: 'VERIFIER' as AudienceScope, displayOrder: 1 },
    { title: 'Assess Impact', description: 'Evaluate the actual environmental benefit and carbon reduction', icon: 'AlertCircle', category: 'VERIFICATION' as GuidelineCategory, audience: 'VERIFIER' as AudienceScope, displayOrder: 2 },
    { title: 'Multi-Verification', description: 'Major actions require consensus from multiple verifiers', icon: 'FileCheck', category: 'VERIFICATION' as GuidelineCategory, audience: 'VERIFIER' as AudienceScope, displayOrder: 3 },
    
    // Admin guidelines
    { title: 'Platform Oversight', description: 'Monitor all platform activities and user behavior', icon: 'Shield', category: 'PLATFORM' as GuidelineCategory, audience: 'ADMIN' as AudienceScope, displayOrder: 1 },
    { title: 'System Management', description: 'Configure and maintain platform settings', icon: 'Settings', category: 'PLATFORM' as GuidelineCategory, audience: 'ADMIN' as AudienceScope, displayOrder: 2 },
    { title: 'Issue Resolution', description: 'Promptly address flagged items and user concerns', icon: 'AlertTriangle', category: 'PLATFORM' as GuidelineCategory, audience: 'ADMIN' as AudienceScope, displayOrder: 3 },
    
    // General guidelines
    { title: 'Data Accuracy', description: 'Ensure all submitted data is accurate and verifiable', icon: 'Database', category: 'GENERAL' as GuidelineCategory, audience: 'GLOBAL' as AudienceScope, displayOrder: 1 },
    { title: 'Timely Response', description: 'Respond to verification requests within 48 hours', icon: 'Clock', category: 'GENERAL' as GuidelineCategory, audience: 'GLOBAL' as AudienceScope, displayOrder: 2 },
    { title: 'Transparency', description: 'Maintain full transparency in all carbon credit transactions', icon: 'Eye', category: 'GENERAL' as GuidelineCategory, audience: 'GLOBAL' as AudienceScope, displayOrder: 3 },
    
    // Marketplace guidelines
    { title: 'Fair Pricing', description: 'Set competitive and fair prices for carbon credits', icon: 'DollarSign', category: 'MARKETPLACE' as GuidelineCategory, audience: 'GLOBAL' as AudienceScope, displayOrder: 1 },
    { title: 'Verified Credits Only', description: 'Only verified credits can be listed for sale', icon: 'BadgeCheck', category: 'MARKETPLACE' as GuidelineCategory, audience: 'GLOBAL' as AudienceScope, displayOrder: 2 }
];

// FAQs for different audiences
const faqs = [
    // General FAQs
    { question: 'What is EcoCred?', answer: 'EcoCred is a blockchain-based platform for tracking, verifying, and trading carbon credits earned through environmental actions.', category: 'General', audience: 'GLOBAL' as AudienceScope, displayOrder: 1 },
    { question: 'How do carbon credits work?', answer: 'Carbon credits represent a reduction in greenhouse gas emissions. Companies earn credits by performing verified eco-friendly actions, which can then be traded or retired.', category: 'General', audience: 'GLOBAL' as AudienceScope, displayOrder: 2 },
    { question: 'Is my data secure?', answer: 'Yes, all transactions are recorded on a secure blockchain, and your personal data is encrypted and protected according to industry standards.', category: 'General', audience: 'GLOBAL' as AudienceScope, displayOrder: 3 },
    
    // Company FAQs
    { question: 'How do I log an eco action?', answer: 'Navigate to the Actions page and click "Log New Action". Fill in the details about your environmental action and submit supporting documentation.', category: 'Actions', audience: 'COMPANY' as AudienceScope, displayOrder: 1 },
    { question: 'How long does verification take?', answer: 'Verification typically takes 24-48 hours. Complex actions requiring multiple verifiers may take longer.', category: 'Actions', audience: 'COMPANY' as AudienceScope, displayOrder: 2 },
    { question: 'How do I sell my carbon credits?', answer: 'Go to the Marketplace, click "Create Listing", set your price and quantity, and confirm the listing. Buyers can then purchase your credits.', category: 'Marketplace', audience: 'COMPANY' as AudienceScope, displayOrder: 3 },
    { question: 'What is staking?', answer: 'Staking locks your carbon credits for a period of time in exchange for rewards. Longer staking periods offer higher reward rates.', category: 'Staking', audience: 'COMPANY' as AudienceScope, displayOrder: 4 },
    
    // Verifier FAQs
    { question: 'How do I verify an action?', answer: 'Review the submitted documentation, assess the environmental impact, and either approve or reject with comments. Approved actions trigger credit minting.', category: 'Verification', audience: 'VERIFIER' as AudienceScope, displayOrder: 1 },
    { question: 'What should I look for when verifying?', answer: 'Check that documentation is authentic, quantities are accurate, the action description matches evidence, and the claimed environmental impact is reasonable.', category: 'Verification', audience: 'VERIFIER' as AudienceScope, displayOrder: 2 },
    
    // Auditor FAQs
    { question: 'What are my auditing responsibilities?', answer: 'Auditors review platform compliance, verify the integrity of actions and transactions, and flag any suspicious activities for investigation.', category: 'Audit', audience: 'AUDITOR' as AudienceScope, displayOrder: 1 },
    
    // Admin FAQs
    { question: 'How do I manage users?', answer: 'Access the Admin panel to view, edit, or deactivate user accounts. You can also promote users to different roles.', category: 'Admin', audience: 'ADMIN' as AudienceScope, displayOrder: 1 }
];

// Platform settings
const platformSettings = [
    { key: 'platform_name', label: 'Platform Name', value: 'EcoCred', valueType: 'STRING' as SettingValueType, description: 'The name displayed across the platform' },
    { key: 'min_credits_for_listing', label: 'Minimum Credits for Listing', value: '100', valueType: 'NUMBER' as SettingValueType, description: 'Minimum number of credits required to create a marketplace listing' },
    { key: 'verification_required_count', label: 'Verifications Required', value: '1', valueType: 'NUMBER' as SettingValueType, description: 'Number of verifications required to approve an action' },
    { key: 'staking_enabled', label: 'Staking Enabled', value: 'true', valueType: 'BOOLEAN' as SettingValueType, description: 'Whether staking feature is enabled' },
    { key: 'marketplace_fee_percent', label: 'Marketplace Fee %', value: '2.5', valueType: 'NUMBER' as SettingValueType, description: 'Percentage fee charged on marketplace transactions' },
    { key: 'min_stake_duration_days', label: 'Min Stake Duration (Days)', value: '7', valueType: 'NUMBER' as SettingValueType, description: 'Minimum staking duration in days' },
    { key: 'max_stake_duration_days', label: 'Max Stake Duration (Days)', value: '365', valueType: 'NUMBER' as SettingValueType, description: 'Maximum staking duration in days' },
    { key: 'stake_reward_rate', label: 'Stake Reward Rate %', value: '10', valueType: 'NUMBER' as SettingValueType, description: 'Annual reward rate for staking' },
    { key: 'governance_voting_enabled', label: 'Governance Voting', value: 'true', valueType: 'BOOLEAN' as SettingValueType, description: 'Whether governance voting is enabled' },
    { key: 'min_voting_power', label: 'Min Voting Power', value: '1000', valueType: 'NUMBER' as SettingValueType, description: 'Minimum credits required to participate in governance' }
];

async function seedReferenceData() {
    console.log('🌱 Seeding reference data...\n');

    try {
        // Seed Industries
        console.log('🏭 Seeding industries...');
        for (const industry of industries) {
            await prisma.industry.upsert({
                where: { name: industry.name },
                update: industry,
                create: industry
            });
            console.log(`   ✓ ${industry.name}`);
        }
        console.log(`✅ Seeded ${industries.length} industries\n`);

        // Seed Quick Actions
        console.log('⚡ Seeding quick actions...');
        // Clear existing quick actions first
        await prisma.quickAction.deleteMany();
        for (const action of quickActions) {
            await prisma.quickAction.create({ data: action });
            console.log(`   ✓ ${action.title} (${action.audience})`);
        }
        console.log(`✅ Seeded ${quickActions.length} quick actions\n`);

        // Seed Guidelines
        console.log('📋 Seeding guidelines...');
        await prisma.guideline.deleteMany();
        for (const guideline of guidelines) {
            await prisma.guideline.create({ data: guideline });
            console.log(`   ✓ ${guideline.title} (${guideline.audience})`);
        }
        console.log(`✅ Seeded ${guidelines.length} guidelines\n`);

        // Seed FAQs
        console.log('❓ Seeding FAQs...');
        await prisma.faq.deleteMany();
        for (const faq of faqs) {
            await prisma.faq.create({ data: faq });
            console.log(`   ✓ ${faq.question.substring(0, 40)}...`);
        }
        console.log(`✅ Seeded ${faqs.length} FAQs\n`);

        // Seed Platform Settings
        console.log('⚙️ Seeding platform settings...');
        for (const setting of platformSettings) {
            await prisma.platformSetting.upsert({
                where: { key: setting.key },
                update: setting,
                create: setting
            });
            console.log(`   ✓ ${setting.key} = ${setting.value}`);
        }
        console.log(`✅ Seeded ${platformSettings.length} platform settings\n`);

        console.log('🎉 Reference data seeding complete!\n');

    } catch (error) {
        console.error('❌ Error seeding reference data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedReferenceData()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

