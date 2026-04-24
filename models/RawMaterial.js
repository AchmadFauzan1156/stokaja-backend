const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
    namaBahan: { type: String, required: true },
    stok: { type: Number, required: true, default: 0 },
    satuan: { type: String, required: true },
    hargaModal: { type: Number, default: 0 },
    stokMinimum: { type: Number, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);