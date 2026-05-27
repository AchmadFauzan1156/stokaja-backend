const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    pengirim: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    penerima: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null berarti pesan ke admin toko secara general (global)
    },
    isiPesan: {
        type: String,
        required: true
    },
    dibaca: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
