import { Router, Request, Response } from 'express';
import prisma from '../database/client.js';
import { AudienceScope, GuidelineCategory } from '@prisma/client';

const router = Router();

// ==================== INDUSTRIES ====================

// GET all industries
router.get('/industries', async (_req: Request, res: Response) => {
    try {
        const industries = await prisma.industry.findMany({
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: industries });
    } catch (error) {
        console.error('Error fetching industries:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch industries' });
    }
});

// GET single industry
router.get('/industries/:id', async (req: Request, res: Response) => {
    try {
        const industry = await prisma.industry.findUnique({
            where: { id: req.params.id },
            include: { companies: { select: { id: true, name: true, verified: true } } }
        });
        if (!industry) {
            return res.status(404).json({ success: false, error: 'Industry not found' });
        }
        res.json({ success: true, data: industry });
    } catch (error) {
        console.error('Error fetching industry:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch industry' });
    }
});

// ==================== QUICK ACTIONS ====================

// GET quick actions (filtered by audience)
router.get('/quick-actions', async (req: Request, res: Response) => {
    try {
        const { audience } = req.query;
        
        const where: { isActive: boolean; audience?: { in: AudienceScope[] } } = { isActive: true };
        
        if (audience && typeof audience === 'string') {
            // Include GLOBAL actions plus role-specific actions
            where.audience = { in: ['GLOBAL' as AudienceScope, audience.toUpperCase() as AudienceScope] };
        }
        
        const quickActions = await prisma.quickAction.findMany({
            where,
            orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }]
        });
        res.json({ success: true, data: quickActions });
    } catch (error) {
        console.error('Error fetching quick actions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch quick actions' });
    }
});

// ==================== GUIDELINES ====================

// GET guidelines (filtered by audience and category)
router.get('/guidelines', async (req: Request, res: Response) => {
    try {
        const { audience, category } = req.query;
        
        const where: { 
            isActive: boolean; 
            audience?: { in: AudienceScope[] };
            category?: GuidelineCategory;
        } = { isActive: true };
        
        if (audience && typeof audience === 'string') {
            where.audience = { in: ['GLOBAL' as AudienceScope, audience.toUpperCase() as AudienceScope] };
        }
        
        if (category && typeof category === 'string') {
            where.category = category.toUpperCase() as GuidelineCategory;
        }
        
        const guidelines = await prisma.guideline.findMany({
            where,
            orderBy: { displayOrder: 'asc' }
        });
        res.json({ success: true, data: guidelines });
    } catch (error) {
        console.error('Error fetching guidelines:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch guidelines' });
    }
});

// ==================== FAQs ====================

// GET FAQs (filtered by audience and category)
router.get('/faqs', async (req: Request, res: Response) => {
    try {
        const { audience, category } = req.query;
        
        const where: { 
            isActive: boolean; 
            audience?: { in: AudienceScope[] };
            category?: string;
        } = { isActive: true };
        
        if (audience && typeof audience === 'string') {
            where.audience = { in: ['GLOBAL' as AudienceScope, audience.toUpperCase() as AudienceScope] };
        }
        
        if (category && typeof category === 'string') {
            where.category = category;
        }
        
        const faqs = await prisma.faq.findMany({
            where,
            orderBy: { displayOrder: 'asc' }
        });
        res.json({ success: true, data: faqs });
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch FAQs' });
    }
});

// ==================== PLATFORM SETTINGS ====================

// GET all platform settings (public ones)
router.get('/settings', async (_req: Request, res: Response) => {
    try {
        const settings = await prisma.platformSetting.findMany({
            orderBy: { key: 'asc' }
        });
        
        // Convert to key-value object for easier consumption
        const settingsMap: Record<string, string | number | boolean> = {};
        for (const setting of settings) {
            switch (setting.valueType) {
                case 'NUMBER':
                    settingsMap[setting.key] = parseFloat(setting.value);
                    break;
                case 'BOOLEAN':
                    settingsMap[setting.key] = setting.value === 'true';
                    break;
                case 'JSON':
                    try {
                        settingsMap[setting.key] = JSON.parse(setting.value);
                    } catch {
                        settingsMap[setting.key] = setting.value;
                    }
                    break;
                default:
                    settingsMap[setting.key] = setting.value;
            }
        }
        
        res.json({ success: true, data: settingsMap, raw: settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});

// GET single setting by key
router.get('/settings/:key', async (req: Request, res: Response) => {
    try {
        const setting = await prisma.platformSetting.findUnique({
            where: { key: req.params.key }
        });
        if (!setting) {
            return res.status(404).json({ success: false, error: 'Setting not found' });
        }
        res.json({ success: true, data: setting });
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch setting' });
    }
});

// ==================== ROLE OPTIONS (for registration) ====================

// GET role options for registration
router.get('/role-options', async (_req: Request, res: Response) => {
    try {
        // These could also be stored in database if needed
        const roleOptions = [
            { value: 'COMPANY', label: '🏢 Company', description: 'Earn and trade carbon credits' },
            { value: 'VERIFIER', label: '✅ Verifier', description: 'Verify eco actions' },
            { value: 'AUDITOR', label: '🔍 Auditor', description: 'Audit platform activities' }
        ];
        res.json({ success: true, data: roleOptions });
    } catch (error) {
        console.error('Error fetching role options:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch role options' });
    }
});

export default router;

