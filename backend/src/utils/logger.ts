import winston from 'winston';
import { config } from '../config/app.js';

const logLevel = config.LOG_LEVEL;

// Determine if running on Vercel (serverless - can't write files)
const isVercel = process.env.VERCEL === '1';

// Create base transports array with console
const transports: winston.transport[] = [
    // Write all logs to console
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
            })
        )
    })
];

// Only add file transports if NOT on Vercel
if (!isVercel) {
    transports.push(
        // Write errors to file
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs to file
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );
}

export const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'ecocred-api' },
    transports
});
