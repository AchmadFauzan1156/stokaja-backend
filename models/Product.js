const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    nama: {
        type: String,
        required: true,
        index: true
    },
    deskripsi: {
        type: String,
        default: null
    },
    kategori: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    harga: {
        type: Number,
        required: true,
    },
    stok: {
        type: Number,
        default: 0,
    },
    stokMinimum: {
        type: Number,
        default: 5,
    },
    satuan: {
        type: String,
        required: true // Contoh: 'kg', 'liter', 'gram', 'pcs'
    },
    hargaModal: {
        type: Number,
        default: 0,
    },
    gambar: {
        type: String,
        default: null
    },
    stokMaksimum: {
        type: Number,
        default: 100
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;