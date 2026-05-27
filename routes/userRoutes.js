const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { lihatProfil, updateProfil } = require('../controllers/userController');

router.get('/profil', auth, lihatProfil);
router.put('/profil', auth, upload.single('avatar'), updateProfil);

module.exports = router;