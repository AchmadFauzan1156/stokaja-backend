const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    tambahKategori,
    lihatKategori,
    updateKategori,
    hapusKategori
} = require('../controllers/categoryController');

// GET bisa diakses semua yang login (kasir perlu lihat kategori di POS)
router.get('/kategori', auth, lihatKategori);

// CUD hanya admin
router.post('/kategori', auth, authorizeRoles('admin'), tambahKategori);
router.put('/kategori/:id', auth, authorizeRoles('admin'), updateKategori);
router.delete('/kategori/:id', auth, authorizeRoles('admin'), hapusKategori);

module.exports = router;
