import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { config } from '../config/app.js';

const prisma = new PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' }
    ]
});

// Log database queries in development
if (config.NODE_ENV === 'development') {
    prisma.$on('query' as never, (e: any) => {
        logger.debug('Database Query:', {
            query: e.query,
            duration: `${e.duration}ms`
        });
    });
}

prisma.$on('error' as never, (e: any) => {
    logger.error('Database Error:', e);
});

prisma.$on('warn' as never, (e: any) => {
    logger.warn('Database Warning:', e);
});

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
    logger.info('Database connection closed');
});

export default prisma;
