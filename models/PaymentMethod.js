const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    nama: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    aktif: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
