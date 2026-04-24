const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // CATAT ERROR KE FILE LOG
    if (!err.statusCode || err.statusCode >= 500) {
        logger.error({
            message: err.message,
            stack: err.stack,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
        });
    }

    // TANGKAP ERROR UMUM DATABASE & AUTH
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ success: false, pesan: 'Data tidak valid', error: messages });
    }

    if (err.code === 11000) {
        return res.status(409).json({ success: false, pesan: 'Data sudah ada (Duplikat)' });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, pesan: 'Akses ditolak, token tidak valid' });
    }

    // RESPONS DEFAULT
    const statusCode = err.statusCode || 500;
    const pesan = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Terjadi kesalahan pada server kami'
        : err.message;

    res.status(statusCode).json({ success: false, pesan });
};

module.exports = { errorHandler };