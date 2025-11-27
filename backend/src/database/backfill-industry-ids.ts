import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillIndustryIds() {
    console.log('🔄 Backfilling company industry IDs...\n');

    try {
        // Get all industries
        const industries = await prisma.industry.findMany();
        const industryMap = new Map(industries.map(i => [i.name.toLowerCase(), i.id]));

        console.log(`Found ${industries.length} industries in database`);

        // Get all companies with industry text but no industryId
        const companies = await prisma.company.findMany({
            where: {
                industry: { not: null },
                industryId: null
            }
        });

        console.log(`Found ${companies.length} companies to backfill\n`);

        let updated = 0;
        let notMatched = 0;

        for (const company of companies) {
            if (!company.industry) continue;

            // Try to find matching industry (case-insensitive)
            const industryId = industryMap.get(company.industry.toLowerCase());

            if (industryId) {
                await prisma.company.update({
                    where: { id: company.id },
                    data: { industryId }
                });
                console.log(`   ✓ ${company.name}: "${company.industry}" → ${industryId}`);
                updated++;
            } else {
                console.log(`   ⚠ ${company.name}: No match for "${company.industry}"`);
                notMatched++;
            }
        }

        console.log(`\n✅ Backfill complete!`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Not matched: ${notMatched}`);

        // If there are unmatched industries, list them
        if (notMatched > 0) {
            console.log('\n📋 Unmatched industries (consider adding to Industry table):');
            const unmatched = new Set<string>();
            for (const company of companies) {
                if (company.industry && !industryMap.has(company.industry.toLowerCase())) {
                    unmatched.add(company.industry);
                }
            }
            unmatched.forEach(i => console.log(`   - ${i}`));
        }

    } catch (error) {
        console.error('❌ Error backfilling industry IDs:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

backfillIndustryIds()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

