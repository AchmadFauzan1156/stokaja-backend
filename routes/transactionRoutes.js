const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const {
    checkoutKasir,
    laporanKeuntungan,
    ubahStatusPesanan,
    grafikPendapatan,
    lihatDaftarPesanan
} = require('../controllers/transactionController');

const { validasiCheckout } = require('../validations/transactionValidation');
const { cekHasilValidasi } = require('../validations/productValidation');

router.post(
    '/checkout',
    auth,
    validasiCheckout,
    cekHasilValidasi,
    checkoutKasir
);

router.get('/laporan', auth, laporanKeuntungan);
router.get('/grafik', auth, grafikPendapatan);
router.get('/transaksi', auth, lihatDaftarPesanan);

router.patch('/transaksi/:id/status', auth, ubahStatusPesanan);

module.exports = router;