const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { tambahProduk, lihatProduk, lihatDetailProduk, editProduk, hapusProduk } = require('../controllers/productController');

const { aturanValidasiProduk, cekHasilValidasi } = require('../validations/productValidation');

router.get('/produk', auth, lihatProduk);

// Detail 1 produk by ID
router.get('/produk/:id', auth, lihatDetailProduk);

router.post(
    '/produk',
    auth,
    authorizeRoles('admin', 'kasir'),
    upload.single('gambar'),
    aturanValidasiProduk,
    cekHasilValidasi,
    tambahProduk
);

router.put(
    '/produk/:id',
    auth,
    authorizeRoles('admin', 'kasir'),
    upload.single('gambar'),
    aturanValidasiProduk,
    cekHasilValidasi,
    editProduk
);

router.delete('/produk/:id', auth, authorizeRoles('admin', 'kasir'), hapusProduk);

module.exports = router;