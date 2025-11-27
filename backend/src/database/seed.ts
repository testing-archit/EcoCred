import { PrismaClient, ActionStatus, ListingStatus, Company, Action as PrismaAction } from '@prisma/client';

const prisma = new PrismaClient();

// Sample wallet addresses (these would be real MetaMask addresses in production)
const walletAddresses = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
    '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
    '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
    '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    '0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC',
    '0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9'
];

// Company data
const companies = [
    {
        walletAddress: walletAddresses[0],
        name: 'GreenTech Solutions',
        description: 'Leading provider of renewable energy solutions and carbon offset programs',
        industry: 'Renewable Energy',
        website: 'https://greentech-solutions.example.com',
        location: 'San Francisco, CA',
        verified: true
    },
    {
        walletAddress: walletAddresses[1],
        name: 'EcoManufacturing Inc',
        description: 'Sustainable manufacturing with zero-waste production processes',
        industry: 'Manufacturing',
        website: 'https://ecomanufacturing.example.com',
        location: 'Portland, OR',
        verified: true
    },
    {
        walletAddress: walletAddresses[2],
        name: 'Forest Guardians',
        description: 'Reforestation and forest conservation organization',
        industry: 'Environmental Conservation',
        website: 'https://forestguardians.example.com',
        location: 'Seattle, WA',
        verified: true
    },
    {
        walletAddress: walletAddresses[3],
        name: 'CleanOcean Initiative',
        description: 'Ocean cleanup and marine ecosystem restoration',
        industry: 'Environmental Conservation',
        website: 'https://cleanocean.example.com',
        location: 'Miami, FL',
        verified: true
    },
    {
        walletAddress: walletAddresses[4],
        name: 'SolarPower Corp',
        description: 'Commercial solar panel installation and maintenance',
        industry: 'Renewable Energy',
        website: 'https://solarpower-corp.example.com',
        location: 'Austin, TX',
        verified: false
    },
    {
        walletAddress: walletAddresses[5],
        name: 'RecycleRight',
        description: 'Advanced recycling technology and waste management',
        industry: 'Waste Management',
        website: 'https://recycleright.example.com',
        location: 'Denver, CO',
        verified: true
    },
    {
        walletAddress: walletAddresses[6],
        name: 'WindEnergy Partners',
        description: 'Wind farm development and clean energy distribution',
        industry: 'Renewable Energy',
        website: 'https://windenergy.example.com',
        location: 'Chicago, IL',
        verified: false
    },
    {
        walletAddress: walletAddresses[7],
        name: 'Urban Green Spaces',
        description: 'Urban reforestation and green infrastructure development',
        industry: 'Urban Planning',
        website: 'https://urbangreenspaces.example.com',
        location: 'New York, NY',
        verified: true
    }
];

// Action types and their typical credit values
const actionTypes = [
    { type: 'tree_planting', unit: 'trees', creditPerUnit: 10 },
    { type: 'solar_installation', unit: 'kW', creditPerUnit: 50 },
    { type: 'recycling', unit: 'kg', creditPerUnit: 2 },
    { type: 'renewable_energy', unit: 'kWh', creditPerUnit: 1 },
    { type: 'carbon_capture', unit: 'tons', creditPerUnit: 100 },
    { type: 'ocean_cleanup', unit: 'kg', creditPerUnit: 5 },
    { type: 'energy_efficiency', unit: 'kWh saved', creditPerUnit: 3 },
    { type: 'composting', unit: 'kg', creditPerUnit: 1 }
];

// Sample actions
const actions = [
    {
        companyIndex: 0,
        actionType: 'solar_installation',
        description: 'Installed 500kW solar panel system on commercial building rooftop',
        quantity: 500,
        unit: 'kW',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 25000
    },
    {
        companyIndex: 0,
        actionType: 'renewable_energy',
        description: 'Generated 50,000 kWh of clean solar energy in Q4 2024',
        quantity: 50000,
        unit: 'kWh',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 50000
    },
    {
        companyIndex: 1,
        actionType: 'recycling',
        description: 'Recycled 10,000 kg of industrial waste materials',
        quantity: 10000,
        unit: 'kg',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 20000
    },
    {
        companyIndex: 1,
        actionType: 'energy_efficiency',
        description: 'Reduced energy consumption by 15,000 kWh through LED upgrades',
        quantity: 15000,
        unit: 'kWh saved',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 45000
    },
    {
        companyIndex: 2,
        actionType: 'tree_planting',
        description: 'Planted 5,000 native trees in reforestation project',
        quantity: 5000,
        unit: 'trees',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 50000
    },
    {
        companyIndex: 2,
        actionType: 'tree_planting',
        description: 'Planted 3,000 trees in urban forest restoration',
        quantity: 3000,
        unit: 'trees',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 30000
    },
    {
        companyIndex: 3,
        actionType: 'ocean_cleanup',
        description: 'Removed 2,500 kg of plastic waste from coastal waters',
        quantity: 2500,
        unit: 'kg',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 12500
    },
    {
        companyIndex: 3,
        actionType: 'ocean_cleanup',
        description: 'Cleaned 5,000 kg of debris from marine ecosystems',
        quantity: 5000,
        unit: 'kg',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 25000
    },
    {
        companyIndex: 4,
        actionType: 'solar_installation',
        description: 'Installed 300kW solar array for commercial client',
        quantity: 300,
        unit: 'kW',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 15000
    },
    {
        companyIndex: 4,
        actionType: 'renewable_energy',
        description: 'Generated 30,000 kWh of solar power',
        quantity: 30000,
        unit: 'kWh',
        status: 'PENDING' as ActionStatus,
        creditsAwarded: 0
    },
    {
        companyIndex: 5,
        actionType: 'recycling',
        description: 'Processed 25,000 kg of recyclable materials',
        quantity: 25000,
        unit: 'kg',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 50000
    },
    {
        companyIndex: 5,
        actionType: 'composting',
        description: 'Composted 8,000 kg of organic waste',
        quantity: 8000,
        unit: 'kg',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 8000
    },
    {
        companyIndex: 6,
        actionType: 'renewable_energy',
        description: 'Wind farm generated 100,000 kWh of clean energy',
        quantity: 100000,
        unit: 'kWh',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 100000
    },
    {
        companyIndex: 6,
        actionType: 'carbon_capture',
        description: 'Captured 50 tons of CO2 through carbon sequestration',
        quantity: 50,
        unit: 'tons',
        status: 'PENDING' as ActionStatus,
        creditsAwarded: 0
    },
    {
        companyIndex: 7,
        actionType: 'tree_planting',
        description: 'Planted 2,000 trees in urban green spaces',
        quantity: 2000,
        unit: 'trees',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 20000
    },
    {
        companyIndex: 7,
        actionType: 'tree_planting',
        description: 'Created new urban forest with 1,500 trees',
        quantity: 1500,
        unit: 'trees',
        status: 'VERIFIED' as ActionStatus,
        creditsAwarded: 15000
    }
];

async function seed() {
    console.log('🌱 Starting database seed...\n');

    try {
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await prisma.vote.deleteMany();
        await prisma.stake.deleteMany();
        await prisma.listing.deleteMany();
        await prisma.verification.deleteMany();
        await prisma.document.deleteMany();
        await prisma.action.deleteMany();
        await prisma.company.deleteMany();
        console.log('✅ Existing data cleared\n');

        // Create companies
        console.log('🏢 Creating companies...');
        const createdCompanies: Company[] = [];
        for (const company of companies) {
            const created = await prisma.company.create({
                data: company
            });
            createdCompanies.push(created);
            console.log(`   ✓ ${created.name}`);
        }
        console.log(`✅ Created ${createdCompanies.length} companies\n`);

        // Create actions
        console.log('🌱 Creating eco actions...');
        const createdActions: PrismaAction[] = [];
        for (const action of actions) {
            const created = await prisma.action.create({
                data: {
                    companyId: createdCompanies[action.companyIndex].id,
                    actionType: action.actionType,
                    description: action.description,
                    quantity: action.quantity,
                    unit: action.unit,
                    status: action.status,
                    creditsAwarded: action.creditsAwarded,
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
                }
            });
            createdActions.push(created);
            console.log(`   ✓ ${action.description.substring(0, 50)}...`);
        }
        console.log(`✅ Created ${createdActions.length} actions\n`);

        // Create verifications for verified actions
        console.log('✔️  Creating verifications...');
        let verificationCount = 0;
        for (const action of createdActions) {
            if (action.status === 'VERIFIED') {
                // Use a different company as verifier
                const verifierIndex = Math.floor(Math.random() * createdCompanies.length);
                await prisma.verification.create({
                    data: {
                        actionId: action.id,
                        verifierId: createdCompanies[verifierIndex].id,
                        approved: true,
                        comments: 'Verified through documentation review and site inspection',
                        createdAt: new Date(action.createdAt.getTime() + 24 * 60 * 60 * 1000) // 1 day after action
                    }
                });
                verificationCount++;
            }
        }
        console.log(`✅ Created ${verificationCount} verifications\n`);

        // Create marketplace listings
        console.log('🛒 Creating marketplace listings...');
        const listings = [
            {
                sellerId: createdCompanies[0].id,
                amount: 10000,
                pricePerCredit: '0.05',
                totalPrice: '500',
                status: 'ACTIVE' as ListingStatus
            },
            {
                sellerId: createdCompanies[2].id,
                amount: 15000,
                pricePerCredit: '0.045',
                totalPrice: '675',
                status: 'ACTIVE' as ListingStatus
            },
            {
                sellerId: createdCompanies[5].id,
                amount: 8000,
                pricePerCredit: '0.055',
                totalPrice: '440',
                status: 'ACTIVE' as ListingStatus
            },
            {
                sellerId: createdCompanies[1].id,
                amount: 5000,
                pricePerCredit: '0.05',
                totalPrice: '250',
                status: 'SOLD' as ListingStatus,
                buyerAddress: walletAddresses[3]
            }
        ];

        for (const listing of listings) {
            await prisma.listing.create({
                data: {
                    ...listing,
                    createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
                }
            });
        }
        console.log(`✅ Created ${listings.length} marketplace listings\n`);

        // Create stakes
        console.log('💰 Creating stakes...');
        const stakes = [
            {
                stakerId: createdCompanies[0].id,
                amount: 20000,
                duration: 30 * 24 * 60 * 60, // 30 days
                startTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                claimed: false,
                rewardAmount: 2000
            },
            {
                stakerId: createdCompanies[2].id,
                amount: 30000,
                duration: 60 * 24 * 60 * 60, // 60 days
                startTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
                claimed: false,
                rewardAmount: 4500
            },
            {
                stakerId: createdCompanies[5].id,
                amount: 15000,
                duration: 30 * 24 * 60 * 60,
                startTime: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
                endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                claimed: true,
                rewardAmount: 1500
            }
        ];

        for (const stake of stakes) {
            await prisma.stake.create({ data: stake });
        }
        console.log(`✅ Created ${stakes.length} stakes\n`);

        // Create governance votes
        console.log('🗳️  Creating governance votes...');
        const votes = [
            { proposalId: 1, voterId: createdCompanies[0].id, support: true, votingPower: 75000 },
            { proposalId: 1, voterId: createdCompanies[1].id, support: true, votingPower: 65000 },
            { proposalId: 1, voterId: createdCompanies[2].id, support: false, votingPower: 80000 },
            { proposalId: 1, voterId: createdCompanies[3].id, support: true, votingPower: 37500 },
            { proposalId: 2, voterId: createdCompanies[0].id, support: false, votingPower: 75000 },
            { proposalId: 2, voterId: createdCompanies[5].id, support: true, votingPower: 58000 },
            { proposalId: 2, voterId: createdCompanies[7].id, support: true, votingPower: 35000 }
        ];

        for (const vote of votes) {
            await prisma.vote.create({
                data: {
                    ...vote,
                    createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
                }
            });
        }
        console.log(`✅ Created ${votes.length} governance votes\n`);

        // Create analytics snapshot
        console.log('📊 Creating analytics snapshot...');
        await prisma.analytics.create({
            data: {
                totalCompanies: createdCompanies.length,
                totalActions: createdActions.length,
                totalCreditsIssued: createdActions.reduce((sum, a) => sum + a.creditsAwarded, 0),
                totalBadgesMinted: 12, // Simulated
                totalStaked: stakes.reduce((sum, s) => sum + s.amount, 0),
                totalMarketVolume: '1865', // Sum of listing prices
                snapshotDate: new Date()
            }
        });
        console.log('✅ Analytics snapshot created\n');

        // Summary
        console.log('📈 Seed Summary:');
        console.log(`   Companies: ${createdCompanies.length}`);
        console.log(`   Actions: ${createdActions.length}`);
        console.log(`   Verifications: ${verificationCount}`);
        console.log(`   Listings: ${listings.length}`);
        console.log(`   Stakes: ${stakes.length}`);
        console.log(`   Votes: ${votes.length}`);
        console.log(`   Total Credits Issued: ${createdActions.reduce((sum, a) => sum + a.creditsAwarded, 0).toLocaleString()}`);
        console.log('\n✅ Database seeded successfully! 🎉\n');

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
