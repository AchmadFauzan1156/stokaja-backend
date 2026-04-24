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
    alamatLengkap: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['admin', 'kasir', 'pelanggan'],
        default: 'pelanggan'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);