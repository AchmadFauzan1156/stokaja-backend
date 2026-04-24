const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    nomorResi: {
        type: String,
        required: true,
        unique: true
    },
    pelangganId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    keranjang: [{
        produkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        jumlahBeli: { type: Number, required: true },
        hargaSatuan: { type: Number }
    }],
    pajak: {
        type: Number,
        default: 0 // Simpan nominal pajaknya (misal: Rp 11.000)
    },
    totalHarga: {
        type: Number,
        required: true
    },
    statusPesanan: {
        type: String,
        enum: ['pending', 'diproses', 'dikirim', 'selesai'],
        default: 'pending',
    },
    lokasiPengiriman: {
        lat: { type: Number },
        lng: { type: Number },
        alamatDetail: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);