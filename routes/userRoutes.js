const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload');
const { lihatProfil, updateProfil, tambahAlamat, editAlamat, hapusAlamat, getAllUsers, createUser, updateUserRole, deleteUser } = require('../controllers/userController');

// Profil
router.get('/profil', auth, lihatProfil);
router.put('/profil', auth, upload.single('avatar'), updateProfil);

// CRUD Alamat
router.post('/profil/alamat', auth, tambahAlamat);
router.put('/profil/alamat/:alamatId', auth, editAlamat);
router.delete('/profil/alamat/:alamatId', auth, hapusAlamat);

// CRUD Admin (Hanya untuk Admin)
router.get('/', auth, authorizeRoles('admin'), getAllUsers);
router.post('/', auth, authorizeRoles('admin'), createUser);
router.put('/:id/role', auth, authorizeRoles('admin'), updateUserRole);
router.delete('/:id', auth, authorizeRoles('admin'), deleteUser);

module.exports = router;