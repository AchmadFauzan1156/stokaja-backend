const { body, validationResult } = require('express-validator');

const aturanValidasiProduk = [
    body('nama')
        .notEmpty().withMessage('Nama produk tidak boleh kosong')
        .isLength({ min: 3 }).withMessage('Nama produk minimal 3 karakter'),
    
    body('harga')
        .notEmpty().withMessage('Harga harus diisi')
        .isNumeric().withMessage('Harga harus berupa angka')
        .isInt({ min: 100 }).withMessage('Harga tidak masuk akal (minimal Rp 100)'),

    body('stok')
        .notEmpty().withMessage('Stok harus diisi')
        .isInt({ min: 0 }).withMessage('Stok tidak boleh minus')
];

const cekHasilValidasi = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Data input tidak valid!",
            errors: errors.array()
        });
    }
    next();
};

module.exports = { aturanValidasiProduk, cekHasilValidasi };