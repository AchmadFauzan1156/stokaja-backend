const express = require('express');
const router = express.Router();

const { registerUser, loginUser } = require('../controllers/authController');

const { validasiRegister, validasiLogin } = require('../validations/authValidation');

const { cekHasilValidasi } = require('../validations/productValidation');

router.post(
    '/register',
    validasiRegister,
    cekHasilValidasi,
    registerUser
);

router.post(
    '/login',
    validasiLogin,
    cekHasilValidasi,
    loginUser
);

module.exports = router;