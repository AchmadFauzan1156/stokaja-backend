const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { validationResult } = require('express-validator');

// Import Controller & Validasi
const { registerUser, loginUser, refreshToken, logoutUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { validasiRegister, validasiLogin } = require('../validations/authValidation');

// Buat fungsi pengecek validasi khusus untuk Auth di sini agar tidak pinjam dari Product
const cekValidasiAuth = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, pesan: 'Data tidak valid', errors: errors.array() });
    }
    next();
};

// Import Rate Limiter
const rateLimit = require('express-rate-limit');

// Strict Rate Limiter untuk mencegah Brute Force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 10, // batas maksimal 10 request per IP untuk endpoint krusial
    message: { success: false, pesan: "Terlalu banyak percobaan login/reset. Silakan coba lagi setelah 15 menit." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Daftarkan rute dengan fungsi pelindung yang baru
router.post('/register', authLimiter, validasiRegister, cekValidasiAuth, registerUser);
router.post('/login', authLimiter, validasiLogin, cekValidasiAuth, loginUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', auth, logoutUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

module.exports = router;