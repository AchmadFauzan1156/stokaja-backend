const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { lihatProfil, updateProfil } = require('../controllers/userController');

router.get('/profil', auth, lihatProfil);

router.put('/profil', auth, updateProfil);

module.exports = router;