const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { lihatProfil, updateProfil, tambahAlamat, editAlamat, hapusAlamat } = require('../controllers/userController');

// Profil
router.get('/profil', auth, lihatProfil);
router.put('/profil', auth, upload.single('avatar'), updateProfil);

// CRUD Alamat
router.post('/profil/alamat', auth, tambahAlamat);
router.put('/profil/alamat/:alamatId', auth, editAlamat);
router.delete('/profil/alamat/:alamatId', auth, hapusAlamat);

module.exports = router;