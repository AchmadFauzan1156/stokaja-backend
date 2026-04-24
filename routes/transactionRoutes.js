const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const {
    checkoutKasir,
    lihatPesananSaya,
    laporanKeuntungan,
    ubahStatusPesanan,
    grafikPendapatan,
    lihatDaftarPesanan,
    exportLaporanExcel,
    generateStrukPDF
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

// Pelanggan, Kasir, Admin boleh checkout
router.post('/checkout', auth, validasiCheckout, cekHasilValidasi, checkoutKasir);

// Khusus pelanggan melihat riwayatnya sendiri
router.get('/pesananku', auth, authorizeRoles('pelanggan', 'admin'), lihatPesananSaya);

// Generate Struk PDF
router.get('/transaksi/:id/pdf', auth, generateStrukPDF);

// HANYA Admin yang boleh lihat laporan keuntungan & Excel
router.get('/laporan', auth, authorizeRoles('admin'), laporanKeuntungan);
router.get('/grafik', auth, authorizeRoles('admin'), grafikPendapatan);
router.get('/laporan/excel', auth, authorizeRoles('admin'), exportLaporanExcel);

// Kasir & Admin boleh lihat semua daftar pesanan toko
router.get('/transaksi', auth, authorizeRoles('admin', 'kasir'), lihatDaftarPesanan);

// HANYA Kasir & Admin yang boleh mengubah status (pelanggan dilarang)
router.patch('/transaksi/:id/status', auth, authorizeRoles('admin', 'kasir'), ubahStatusPesanan);

module.exports = router;