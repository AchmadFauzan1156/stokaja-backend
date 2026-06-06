const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    tambahBahanBaku,
    lihatBahanBaku,
    updateBahanBaku,
    hapusBahanBaku
} = require('../controllers/rawMaterialController');

// GET bisa diakses oleh semua role (termasuk pelanggan) agar bisa dibeli
router.get('/bahan-baku', auth, lihatBahanBaku);

// CUD hanya admin
router.post('/bahan-baku', auth, authorizeRoles('admin'), upload.single('gambar'), tambahBahanBaku);
router.put('/bahan-baku/:id', auth, authorizeRoles('admin'), upload.single('gambar'), updateBahanBaku);
router.delete('/bahan-baku/:id', auth, authorizeRoles('admin'), hapusBahanBaku);

module.exports = router;