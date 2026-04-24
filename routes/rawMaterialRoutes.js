const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    tambahBahanBaku,
    lihatBahanBaku,
    updateBahanBaku,
    hapusBahanBaku
} = require('../controllers/rawMaterialController');

// Semua rute di bawah ini wajib login dan wajib jabatan Admin
router.use(auth, authorizeRoles('admin'));

router.post('/bahan-baku', tambahBahanBaku);
router.get('/bahan-baku', lihatBahanBaku);
router.put('/bahan-baku/:id', updateBahanBaku);
router.delete('/bahan-baku/:id', hapusBahanBaku);

module.exports = router;