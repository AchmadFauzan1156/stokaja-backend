const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    nama: {
        type: String,
        required: true,
    },
    harga: {
        type: Number,
        required: true,
    },
    stok: {
        type: Number,
        default: 0,
    },
    gambar: {
        type: String,
        default: null
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;