const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    nomorResi: {
        type: String,
        required: true,
        unique: true
    },
    keranjang: [{
        produkId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        jumlahBeli: {
            type: Number,
            required: true
        },
        hargaSatuan: {
            type: Number
        }
    }],
    totalHarga: {
        type: Number,
        required: true,
    },
    statusPesanan: {
        type: String,
        enum: ['pending', 'diproses', 'dikirim', 'selesai'],
        default: 'pending',
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);