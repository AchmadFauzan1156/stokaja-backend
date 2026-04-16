const { body } = require('express-validator');

const validasiRegister = [
    body('nama')
        .trim()
        .notEmpty().withMessage('Nama lengkap tidak boleh kosong')
        .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email harus diisi')
        .isEmail().withMessage('Format email tidak valid (contoh: user@mail.com)'),

    body('password')
        .notEmpty().withMessage('Password harus diisi')
        .isLength({ min: 8 }).withMessage('Password terlalu lemah, minimal 8 karakter')
        .matches(/\d/).withMessage('Password harus mengandung minimal satu angka')
];

const validasiLogin = [
    body('email').isEmail().withMessage('Format email salah'),
    body('password').notEmpty().withMessage('Password tidak boleh kosong')
];

module.exports = { validasiRegister, validasiLogin };