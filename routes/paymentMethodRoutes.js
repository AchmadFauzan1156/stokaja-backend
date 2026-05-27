const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    tambahMetode,
    lihatMetode,
    updateMetode,
    hapusMetode
} = require('../controllers/paymentMethodController');

// GET bisa diakses semua yang login (kasir perlu lihat metode bayar saat checkout)
router.get('/metode-bayar', auth, lihatMetode);

// CUD hanya admin
router.post('/metode-bayar', auth, authorizeRoles('admin'), tambahMetode);
router.put('/metode-bayar/:id', auth, authorizeRoles('admin'), updateMetode);
router.delete('/metode-bayar/:id', auth, authorizeRoles('admin'), hapusMetode);

module.exports = router;
