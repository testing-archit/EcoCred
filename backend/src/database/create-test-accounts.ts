/**
 * Script to create test accounts for different roles
 * Usage: tsx src/database/create-test-accounts.ts
 */

import prisma from './client.js';
import { hashPassword } from '../utils/password.js';

// Test wallet addresses (Hardhat default accounts)
const TEST_ACCOUNTS = [
    {
        email: 'company@ecocred.test',
        password: 'Company123!',
        walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat account #0
        role: 'COMPANY' as const,
        name: 'Test Company Ltd'
    },
    {
        email: 'verifier@ecocred.test',
        password: 'Verifier123!',
        walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat account #1
        role: 'VERIFIER' as const,
        name: 'Test Verifier'
    },
    {
        email: 'auditor@ecocred.test',
        password: 'Auditor123!',
        walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Hardhat account #2
        role: 'AUDITOR' as const,
        name: 'Test Auditor'
    }
];

async function createTestAccounts() {
    console.log('🚀 Creating test accounts...\n');

    const createdAccounts: Array<typeof TEST_ACCOUNTS[number] & { exists?: boolean; userId?: string }> = [];

    for (const account of TEST_ACCOUNTS) {
        try {
            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: account.email },
                        { walletAddress: account.walletAddress.toLowerCase() }
                    ]
                }
            });

            if (existingUser) {
                console.log(`⚠️  Account already exists: ${account.email} (${account.role})`);
                console.log(`   Email: ${account.email}`);
                console.log(`   Password: ${account.password}`);
                console.log(`   Wallet: ${account.walletAddress}`);
                console.log(`   Role: ${account.role}\n`);

                createdAccounts.push({
                    ...account,
                    exists: true
                });
                continue;
            }

            // Hash password
            const passwordHash = await hashPassword(account.password);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email: account.email,
                    passwordHash,
                    walletAddress: account.walletAddress.toLowerCase(),
                    role: account.role,
                    emailVerified: true // Auto-verify for test accounts
                }
            });

            // If COMPANY role, create company profile
            if (account.role === 'COMPANY') {
                let company = await prisma.company.findUnique({
                    where: { walletAddress: account.walletAddress.toLowerCase() }
                });

                if (!company) {
                    company = await prisma.company.create({
                        data: {
                            walletAddress: account.walletAddress.toLowerCase(),
                            name: account.name
                        }
                    });
                }

                // Link user to company
                await prisma.user.update({
                    where: { id: user.id },
                    data: { companyId: company.id }
                });
            }

            console.log(`✅ Created account: ${account.email} (${account.role})`);
            console.log(`   Email: ${account.email}`);
            console.log(`   Password: ${account.password}`);
            console.log(`   Wallet: ${account.walletAddress}`);
            console.log(`   Role: ${account.role}\n`);

            createdAccounts.push({
                ...account,
                userId: user.id
            });
        } catch (error) {
            console.error(`❌ Failed to create account ${account.email}:`, error);
        }
    }

    console.log('\n📋 Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ACCOUNT CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const account of createdAccounts) {
        console.log(`👤 ${account.role} Account:`);
        console.log(`   Email:    ${account.email}`);
        console.log(`   Password: ${account.password}`);
        console.log(`   Wallet:   ${account.walletAddress}`);
        console.log(`   Role:     ${account.role}`);
        if (account.exists) {
            console.log(`   Status:   Already existed`);
        } else {
            console.log(`   Status:   ✅ Created`);
        }
        console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n💡 These accounts use Hardhat default wallet addresses.');
    console.log('   Make sure your MetaMask is connected to Hardhat network');
    console.log('   and import these private keys if needed.\n');
}

// Run the script
createTestAccounts()
    .then(() => {
        console.log('✅ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });

