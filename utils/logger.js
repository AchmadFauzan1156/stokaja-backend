const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        // Error berat masuk ke error.log
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        // Semua aktivitas masuk ke combined.log
        new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    ],
});

// Jika masih di komputer lokal (development), tampilkan juga di terminal
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;