const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    nomorResi: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    pelangganId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true
    },
    keranjang: [{
        produkId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'keranjang.tipeItem' },
        tipeItem: { type: String, enum: ['Product', 'RawMaterial'], default: 'Product' },
        jumlahBeli: { type: Number, required: true },
        hargaSatuan: { type: Number }
    }],
    metodePembayaran: {
        type: String,
        default: 'tunai'
    },
    jumlahDibayar: {
        type: Number,
        default: 0
    },
    kembalian: {
        type: Number,
        default: 0
    },
    pajak: {
        type: Number,
        default: 0
    },
    totalHarga: {
        type: Number,
        required: true
    },
    marginKeuntungan: {
        type: Number,
        default: 0
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

transactionSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);