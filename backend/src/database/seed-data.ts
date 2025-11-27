/**
 * Seed data for ActionTypes and BadgeDefinitions
 * This replaces all hardcoded data with database entries
 */

import { PrismaClient, BadgeTier } from '@prisma/client';

const prisma = new PrismaClient();

// Action types to seed
const actionTypes = [
    {
        type: 'reforestation',
        label: 'Reforestation & Tree Planting',
        description: 'Planting trees and restoring forests',
        unit: 'trees',
        minCreditsPerUnit: 50,
        maxCreditsPerUnit: 200,
        defaultCreditsPerUnit: 100,
        active: true
    },
    {
        type: 'renewable_energy',
        label: 'Renewable Energy Installation',
        description: 'Installing solar, wind, or other renewable energy systems',
        unit: 'kW',
        minCreditsPerUnit: 100,
        maxCreditsPerUnit: 500,
        defaultCreditsPerUnit: 250,
        active: true
    },
    {
        type: 'waste_reduction',
        label: 'Waste Reduction & Recycling',
        description: 'Reducing waste and implementing recycling programs',
        unit: 'tons',
        minCreditsPerUnit: 10,
        maxCreditsPerUnit: 100,
        defaultCreditsPerUnit: 50,
        active: true
    },
    {
        type: 'energy_efficiency',
        label: 'Energy Efficiency Improvements',
        description: 'Improving energy efficiency in buildings and operations',
        unit: 'kWh saved',
        minCreditsPerUnit: 25,
        maxCreditsPerUnit: 150,
        defaultCreditsPerUnit: 75,
        active: true
    },
    {
        type: 'water_conservation',
        label: 'Water Conservation',
        description: 'Conserving water and implementing water-saving measures',
        unit: '1000L saved',
        minCreditsPerUnit: 5,
        maxCreditsPerUnit: 50,
        defaultCreditsPerUnit: 20,
        active: true
    },
    {
        type: 'sustainable_transport',
        label: 'Sustainable Transportation',
        description: 'Using or providing sustainable transportation solutions',
        unit: 'trips',
        minCreditsPerUnit: 20,
        maxCreditsPerUnit: 100,
        defaultCreditsPerUnit: 50,
        active: true
    },
    {
        type: 'carbon_capture',
        label: 'Carbon Capture Technology',
        description: 'Implementing carbon capture and storage technologies',
        unit: 'tons',
        minCreditsPerUnit: 200,
        maxCreditsPerUnit: 1000,
        defaultCreditsPerUnit: 500,
        active: true
    },
    {
        type: 'other',
        label: 'Other Sustainability Action',
        description: 'Other eco-friendly and sustainable actions',
        unit: 'units',
        minCreditsPerUnit: 10,
        maxCreditsPerUnit: 100,
        defaultCreditsPerUnit: 50,
        active: true
    }
];

// Badge definitions to seed
const badgeDefinitions = [
    {
        name: 'Tree Planter',
        description: 'Planted 100+ trees',
        tier: BadgeTier.BRONZE,
        icon: 'TreePine',
        creditsRequired: 500,
        displayOrder: 1,
        active: true
    },
    {
        name: 'Solar Pioneer',
        description: 'Installed renewable energy systems',
        tier: BadgeTier.GOLD,
        icon: 'Zap',
        creditsRequired: 1500,
        displayOrder: 2,
        active: true
    },
    {
        name: 'Waste Warrior',
        description: 'Implemented comprehensive recycling program',
        tier: BadgeTier.SILVER,
        icon: 'Recycle',
        creditsRequired: 1000,
        displayOrder: 3,
        active: true
    },
    {
        name: 'Carbon Neutral',
        description: 'Achieved net-zero carbon emissions',
        tier: BadgeTier.GOLD,
        icon: 'Shield',
        creditsRequired: 5000,
        displayOrder: 4,
        active: true
    },
    {
        name: 'Eco Innovator',
        description: 'Developed sustainable technology solutions',
        tier: BadgeTier.PLATINUM,
        icon: 'Star',
        creditsRequired: 10000,
        displayOrder: 5,
        active: true
    },
    {
        name: 'Green Leader',
        description: 'Led community sustainability initiatives',
        tier: BadgeTier.GOLD,
        icon: 'Trophy',
        creditsRequired: 3000,
        displayOrder: 6,
        active: true
    },
    {
        name: 'Climate Champion',
        description: 'Made significant contributions to climate action',
        tier: BadgeTier.PLATINUM,
        icon: 'Award',
        creditsRequired: 15000,
        displayOrder: 7,
        active: true
    },
    {
        name: 'Energy Efficient',
        description: 'Reduced energy consumption by 20% or more',
        tier: BadgeTier.SILVER,
        icon: 'Zap',
        creditsRequired: 750,
        displayOrder: 8,
        active: true
    }
];

export async function seedActionTypes() {
    console.log('🌱 Seeding action types...');
    
    for (const actionType of actionTypes) {
        await prisma.actionType.upsert({
            where: { type: actionType.type },
            update: actionType,
            create: actionType
        });
    }
    
    console.log(`✅ Seeded ${actionTypes.length} action types`);
}

export async function seedBadgeDefinitions() {
    console.log('🏆 Seeding badge definitions...');
    
    for (const badge of badgeDefinitions) {
        // Check if badge exists by name
        const existing = await prisma.badgeDefinition.findFirst({
            where: { name: badge.name }
        });
        
        if (existing) {
            await prisma.badgeDefinition.update({
                where: { id: existing.id },
                data: badge
            });
        } else {
            await prisma.badgeDefinition.create({ data: badge });
        }
    }
    
    console.log(`✅ Seeded ${badgeDefinitions.length} badge definitions`);
}

export async function seedAll() {
    try {
        await seedActionTypes();
        await seedBadgeDefinitions();
        console.log('✅ All seed data created successfully!');
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedAll();
}

