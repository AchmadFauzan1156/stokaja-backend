const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    nama: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    deskripsi: {
        type: String,
        default: null
    },
    urutan: {
        type: Number,
        default: 0
    },
    aktif: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
