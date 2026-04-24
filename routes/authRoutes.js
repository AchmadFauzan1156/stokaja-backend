const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { validationResult } = require('express-validator');

// Import Controller & Validasi
const { registerUser, loginUser, refreshToken, logoutUser } = require('../controllers/authController');
const { validasiRegister, validasiLogin } = require('../validations/authValidation');

// Buat fungsi pengecek validasi khusus untuk Auth di sini agar tidak pinjam dari Product
const cekValidasiAuth = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, pesan: 'Data tidak valid', errors: errors.array() });
    }
    next();
};

// Daftarkan rute dengan fungsi pelindung yang baru
router.post('/register', validasiRegister, cekValidasiAuth, registerUser);
router.post('/login', validasiLogin, cekValidasiAuth, loginUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', auth, logoutUser);

module.exports = router;