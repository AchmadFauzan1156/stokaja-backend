const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    namaLengkap: {
        type: String,
        default: null
    },
    noHP: {
        type: String,
        default: null
    },
    alamat: [{
        label: { type: String, required: true },
        alamatDetail: { type: String, required: true },
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    }],
    avatar: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['admin', 'kasir', 'pelanggan'],
        default: 'pelanggan'
    },
    refreshToken: {
        type: String,
        default: null
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpire: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);