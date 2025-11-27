import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { verifySignature, generateToken, generateNonceMessage, authenticateToken, AuthRequest } from '../middleware/auth.js';
import prisma from '../database/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { hashPassword, comparePassword, validatePassword, validateEmail, generateVerificationToken } from '../utils/password.js';
import crypto from 'crypto';

const router = Router();

// Store nonces temporarily (in production, use Redis)
const nonces = new Map<string, { nonce: string; timestamp: number }>();

// Clean up old nonces every 5 minutes
setInterval(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [address, data] of nonces.entries()) {
        if (data.timestamp < fiveMinutesAgo) {
            nonces.delete(address);
        }
    }
}, 5 * 60 * 1000);

// ============================================
// WALLET AUTHENTICATION
// ============================================

// GET /api/auth/nonce - Get nonce for wallet address
router.get('/nonce/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        throw new AppError('Invalid wallet address', 400);
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    nonces.set(walletAddress.toLowerCase(), { nonce, timestamp: Date.now() });

    res.json({
        nonce,
        message: generateNonceMessage(walletAddress, nonce)
    });
});

// POST /api/auth/verify - Verify signature and get JWT token (wallet login)
// Requires email and password if user doesn't have them
router.post(
    '/verify',
    [
        body('walletAddress').isEthereumAddress(),
        body('signature').isString().notEmpty(),
        body('message').isString().notEmpty(),
        body('email').optional().isEmail().normalizeEmail(),
        body('password').optional().isString().isLength({ min: 8 }),
        body('name').optional().isString()
    ],
    async (req, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => `${err.type === 'field' ? err.path : 'field'}: ${err.msg}`).join(', ');
            throw new AppError(`Validation failed: ${errorMessages}`, 400);
        }

        const { walletAddress, signature, message, email, password, name } = req.body;
        const normalizedAddress = walletAddress.toLowerCase();

        // Verify nonce exists
        const nonceData = nonces.get(normalizedAddress);
        if (!nonceData) {
            throw new AppError('Nonce not found or expired', 400);
        }

        // Verify signature
        const isValid = await verifySignature(walletAddress, signature, message);
        if (!isValid) {
            throw new AppError('Invalid signature', 401);
        }

        // Delete used nonce
        nonces.delete(normalizedAddress);

        // Check if user exists with this wallet
        let user = await prisma.user.findUnique({
            where: { walletAddress: normalizedAddress },
            include: { company: true }
        });

        if (!user) {
            // New user - require email and password
            if (!email || !password) {
                throw new AppError('Email and password are required for new users', 400);
            }

            // Validate email format
            if (!validateEmail(email)) {
                throw new AppError('Invalid email format', 400);
            }

            // Validate password strength
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                throw new AppError(passwordValidation.message || 'Invalid password', 400);
            }

            // Check if email is already registered
            const existingUserByEmail = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUserByEmail) {
                throw new AppError('Email already registered', 409);
            }

            // Hash password
            const passwordHash = await hashPassword(password);
            const verificationToken = generateVerificationToken();

            // Check if company exists (legacy data)
            let company = await prisma.company.findUnique({
                where: { walletAddress: normalizedAddress }
            });

            if (!company) {
                // Create new company
                company = await prisma.company.create({
                    data: {
                        walletAddress: normalizedAddress,
                        name: name || `Company ${normalizedAddress.substring(0, 8)}...`
                    }
                });
            }

            // Create user with both wallet and email/password
            user = await prisma.user.create({
                data: {
                    walletAddress: normalizedAddress,
                    email,
                    passwordHash,
                    companyId: company.id,
                    role: 'COMPANY',
                    verificationToken,
                    emailVerified: false
                },
                include: { company: true }
            });
        } else {
            // Existing user - check if they have email/password
            if (!user.email || !user.passwordHash) {
                // User exists but missing email/password - require them
                if (!email || !password) {
                    throw new AppError('Email and password are required to complete your profile', 400);
                }

                // Validate email format
                if (!validateEmail(email)) {
                    throw new AppError('Invalid email format', 400);
                }

                // Validate password strength
                const passwordValidation = validatePassword(password);
                if (!passwordValidation.valid) {
                    throw new AppError(passwordValidation.message || 'Invalid password', 400);
                }

                // Check if email is already registered by another user
                const existingUserByEmail = await prisma.user.findUnique({
                    where: { email }
                });

                if (existingUserByEmail && existingUserByEmail.id !== user.id) {
                    throw new AppError('Email already registered', 409);
                }

                // Hash password and update user
                const passwordHash = await hashPassword(password);
                const verificationToken = generateVerificationToken();

                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        email,
                        passwordHash,
                        verificationToken,
                        emailVerified: false
                    },
                    include: { company: true }
                });
            }
        }

        // Generate JWT token
        const token = generateToken(user.id, user.role, normalizedAddress);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                walletAddress: user.walletAddress,
                emailVerified: user.emailVerified,
                company: user.company ? {
                    id: user.company.id,
                    name: user.company.name,
                    verified: user.company.verified
                } : null
            }
        });
    }
);

// ============================================
// EMAIL/PASSWORD AUTHENTICATION
// ============================================

// POST /api/auth/register - Register with email, password, and wallet address
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isString().isLength({ min: 8 }),
        body('walletAddress').isEthereumAddress(),
        body('name').optional().isString(),
        body('role').optional().isIn(['COMPANY', 'VERIFIER', 'ADMIN', 'AUDITOR'])
    ],
    async (req, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => `${err.type === 'field' ? err.path : 'field'}: ${err.msg}`).join(', ');
            throw new AppError(`Validation failed: ${errorMessages}`, 400);
        }

        const { email, password, walletAddress, name, role } = req.body;
        const normalizedAddress = walletAddress.toLowerCase();

        // Validate email format
        if (!validateEmail(email)) {
            throw new AppError('Invalid email format', 400);
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            throw new AppError(passwordValidation.message || 'Invalid password', 400);
        }

        // Check if user already exists with email
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUserByEmail) {
            throw new AppError('Email already registered', 409);
        }

        // Check if user already exists with wallet address
        const existingUserByWallet = await prisma.user.findUnique({
            where: { walletAddress: normalizedAddress }
        });

        if (existingUserByWallet) {
            throw new AppError('Wallet address already registered', 409);
        }

        // Hash password
        const passwordHash = await hashPassword(password);
        const verificationToken = generateVerificationToken();

        // Create user with both email and wallet
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                walletAddress: normalizedAddress,
                role: role || 'COMPANY',
                verificationToken,
                emailVerified: false
            }
        });

        // If role is COMPANY, create a company profile
        if (user.role === 'COMPANY') {
            // Check if company exists with this wallet
            let company = await prisma.company.findUnique({
                where: { walletAddress: normalizedAddress }
            });

            if (!company) {
                company = await prisma.company.create({
                    data: {
                        walletAddress: normalizedAddress,
                        name: name || `Company ${user.id.substring(0, 8)}`
                    }
                });
            }

            // Link user to company
            await prisma.user.update({
                where: { id: user.id },
                data: { companyId: company.id }
            });
        }

        const userWithCompany = await prisma.user.findUnique({
            where: { id: user.id },
            include: { company: true }
        });

        if (!userWithCompany) {
            throw new AppError('Failed to load user profile after registration', 500);
        }

        // Generate JWT token
        const token = generateToken(userWithCompany.id, userWithCompany.role, normalizedAddress);

        res.status(201).json({
            token,
            user: {
                id: userWithCompany.id,
                email: userWithCompany.email,
                role: userWithCompany.role,
                walletAddress: userWithCompany.walletAddress,
                emailVerified: userWithCompany.emailVerified,
                company: userWithCompany.company ? {
                    id: userWithCompany.company.id,
                    name: userWithCompany.company.name,
                    verified: userWithCompany.company.verified
                } : null
            }
        });
    }
);

// POST /api/auth/login - Login with email and password
// Requires wallet address if user doesn't have one
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isString(),
        body('walletAddress').optional().isEthereumAddress()
    ],
    async (req, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => `${err.type === 'field' ? err.path : 'field'}: ${err.msg}`).join(', ');
            throw new AppError(`Validation failed: ${errorMessages}`, 400);
        }

        const { email, password, walletAddress } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true }
        });

        if (!user || !user.passwordHash) {
            throw new AppError('Invalid credentials', 401);
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.passwordHash);
        if (!isValidPassword) {
            throw new AppError('Invalid credentials', 401);
        }

        // Check if user has wallet address
        if (!user.walletAddress) {
            // User exists but missing wallet address - require it
            if (!walletAddress) {
                throw new AppError('Wallet address is required to complete your profile', 400);
            }

            const normalizedAddress = walletAddress.toLowerCase();

            // Check if wallet is already registered by another user
            const existingUserByWallet = await prisma.user.findUnique({
                where: { walletAddress: normalizedAddress }
            });

            if (existingUserByWallet && existingUserByWallet.id !== user.id) {
                throw new AppError('Wallet address already registered', 409);
            }

            // Update user with wallet address
            await prisma.user.update({
                where: { id: user.id },
                data: { walletAddress: normalizedAddress }
            });

            // If user has a company, update company wallet address
            if (user.company) {
                await prisma.company.update({
                    where: { id: user.company.id },
                    data: { walletAddress: normalizedAddress }
                });
            } else if (user.role === 'COMPANY') {
                // Create company if doesn't exist
                const company = await prisma.company.create({
                    data: {
                        walletAddress: normalizedAddress,
                        name: `Company ${user.id.substring(0, 8)}`
                    }
                });

                await prisma.user.update({
                    where: { id: user.id },
                    data: { companyId: company.id }
                });
            }

            // Fetch updated user
            const updatedUser = await prisma.user.findUnique({
                where: { id: user.id },
                include: { company: true }
            });

            if (updatedUser) {
                const token = generateToken(updatedUser.id, updatedUser.role, normalizedAddress);
                return res.json({
                    token,
                    user: {
                        id: updatedUser.id,
                        email: updatedUser.email,
                        role: updatedUser.role,
                        walletAddress: updatedUser.walletAddress,
                        emailVerified: updatedUser.emailVerified,
                        company: updatedUser.company ? {
                            id: updatedUser.company.id,
                            name: updatedUser.company.name,
                            verified: updatedUser.company.verified
                        } : null
                    }
                });
            }
        }

        // Generate JWT token
        const token = generateToken(user.id, user.role, user.walletAddress || undefined);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                walletAddress: user.walletAddress,
                emailVerified: user.emailVerified,
                company: user.company ? {
                    id: user.company.id,
                    name: user.company.name,
                    verified: user.company.verified
                } : null
            }
        });
    }
);

// ============================================
// USER PROFILE & ROLE MANAGEMENT
// ============================================

// GET /api/auth/me - Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new AppError('Not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { company: true }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        emailVerified: user.emailVerified,
        company: user.company ? {
            id: user.company.id,
            name: user.company.name,
            verified: user.company.verified,
            description: user.company.description,
            industry: user.company.industry,
            location: user.company.location
        } : null
    });
});

// PATCH /api/auth/role - Update user role (admin only for now)
router.patch(
    '/role',
    [
        authenticateToken,
        body('role').isIn(['COMPANY', 'VERIFIER', 'ADMIN', 'AUDITOR'])
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        if (!req.user) {
            throw new AppError('Not authenticated', 401);
        }

        const { role } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: { role }
        });

        res.json({
            id: user.id,
            email: user.email,
            role: user.role
        });
    }
);

// PATCH /api/auth/complete-profile - Complete user profile with missing information
router.patch(
    '/complete-profile',
    [
        authenticateToken,
        body('email').optional().isEmail().normalizeEmail(),
        body('password').optional().isString().isLength({ min: 8 }),
        body('walletAddress').optional().isEthereumAddress()
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError('Validation failed', 400);
        }

        if (!req.user) {
            throw new AppError('Not authenticated', 401);
        }

        const { email, password, walletAddress } = req.body;
        const updateData: any = {};

        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { company: true }
        });

        if (!currentUser) {
            throw new AppError('User not found', 404);
        }

        // Update email if provided and missing
        if (email && !currentUser.email) {
            // Check if email is already registered
            const existingUserByEmail = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUserByEmail) {
                throw new AppError('Email already registered', 409);
            }

            if (!validateEmail(email)) {
                throw new AppError('Invalid email format', 400);
            }

            updateData.email = email;
            updateData.verificationToken = generateVerificationToken();
            updateData.emailVerified = false;
        }

        // Update password if provided and missing
        if (password && !currentUser.passwordHash) {
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                throw new AppError(passwordValidation.message || 'Invalid password', 400);
            }

            updateData.passwordHash = await hashPassword(password);
        }

        // Update wallet address if provided and missing
        if (walletAddress && !currentUser.walletAddress) {
            const normalizedAddress = walletAddress.toLowerCase();

            // Check if wallet is already registered
            const existingUserByWallet = await prisma.user.findUnique({
                where: { walletAddress: normalizedAddress }
            });

            if (existingUserByWallet) {
                throw new AppError('Wallet address already registered', 409);
            }

            updateData.walletAddress = normalizedAddress;

            // Update or create company with wallet address
            if (currentUser.role === 'COMPANY') {
                if (currentUser.company) {
                    await prisma.company.update({
                        where: { id: currentUser.company.id },
                        data: { walletAddress: normalizedAddress }
                    });
                } else {
                    const company = await prisma.company.create({
                        data: {
                            walletAddress: normalizedAddress,
                            name: `Company ${currentUser.id.substring(0, 8)}`
                        }
                    });
                    updateData.companyId = company.id;
                }
            }
        }

        // Update user if there's data to update
        if (Object.keys(updateData).length > 0) {
            const updatedUser = await prisma.user.update({
                where: { id: req.user.userId },
                data: updateData,
                include: { company: true }
            });

            // Generate new token with updated wallet address
            const token = generateToken(updatedUser.id, updatedUser.role, updatedUser.walletAddress || undefined);

            return res.json({
                token,
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    walletAddress: updatedUser.walletAddress,
                    emailVerified: updatedUser.emailVerified,
                    company: updatedUser.company ? {
                        id: updatedUser.company.id,
                        name: updatedUser.company.name,
                        verified: updatedUser.company.verified
                    } : null
                }
            });
        }

        // No updates needed
        res.json({
            message: 'Profile already complete',
            user: {
                id: currentUser.id,
                email: currentUser.email,
                role: currentUser.role,
                walletAddress: currentUser.walletAddress,
                emailVerified: currentUser.emailVerified,
                company: currentUser.company ? {
                    id: currentUser.company.id,
                    name: currentUser.company.name,
                    verified: currentUser.company.verified
                } : null
            }
        });
    }
);

export default router;

