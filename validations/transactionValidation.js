const { body } = require('express-validator');

const validasiCheckout = [
    body('isiKeranjang')
        .isArray({ min: 1 }).withMessage('Keranjang tidak boleh kosong'),
    body('isiKeranjang.*.produkId')
        .isMongoId().withMessage('ID Produk tidak valid'),
    body('isiKeranjang.*.jumlahBeli')
        .isInt({ min: 1 }).withMessage('Jumlah minimal beli adalah 1')
];

module.exports = { validasiCheckout };