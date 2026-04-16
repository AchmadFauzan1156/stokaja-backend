const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { tambahProduk, lihatProduk, editProduk, hapusProduk } = require('../controllers/productController');

const { aturanValidasiProduk, cekHasilValidasi } = require('../validations/productValidation');

router.get('/produk', auth, lihatProduk);

router.post(
    '/produk',
    auth,
    upload.single('gambar'),
    aturanValidasiProduk,
    cekHasilValidasi,
    tambahProduk
);

router.put(
    '/produk/:id',
    auth,
    upload.single('gambar'),
    aturanValidasiProduk,
    cekHasilValidasi,
    editProduk
);

router.delete('/produk/:id', auth, hapusProduk);

module.exports = router;