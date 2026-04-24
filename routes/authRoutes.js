const express = require('express');
const router = express.Router();

const { registerUser, loginUser, refreshToken, logoutUser } = require('../controllers/authController');
const auth = require('../middlewares/auth');
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

router.post(
    '/refresh-token',
    refreshToken);
    
router.post(
    '/logout',
    auth,
    logoutUser);

module.exports = router;