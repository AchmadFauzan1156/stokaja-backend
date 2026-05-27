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

// GET bisa diakses oleh admin DAN kasir (kasir perlu lihat bahan baku di POS)
router.get('/bahan-baku', auth, authorizeRoles('admin', 'kasir'), lihatBahanBaku);

// CUD hanya admin
router.post('/bahan-baku', auth, authorizeRoles('admin'), upload.single('gambar'), tambahBahanBaku);
router.put('/bahan-baku/:id', auth, authorizeRoles('admin'), upload.single('gambar'), updateBahanBaku);
router.delete('/bahan-baku/:id', auth, authorizeRoles('admin'), hapusBahanBaku);

module.exports = router;