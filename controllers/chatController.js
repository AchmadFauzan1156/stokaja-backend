const Message = require('../models/Message');

// Get chat history for the logged in user (pelanggan only sees their own chats with admin, admin sees all chats grouped)
const getChatHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let query = {};
        if (role === 'pelanggan') {
            query = {
                $or: [
                    { pengirim: userId },
                    { penerima: userId }
                ]
            };
        } else {
            // Jika admin/kasir, bisa ambil chat dengan pelanggan spesifik jika userId dikirim via query
            const targetPelanggan = req.query.pelangganId;
            if (targetPelanggan) {
                query = {
                    $or: [
                        { pengirim: targetPelanggan },
                        { penerima: targetPelanggan }
                    ]
                };
            }
            // Jika tidak ada targetPelanggan, mungkin fetch list contact yang pernah nge-chat (bisa ditambahkan nanti)
        }

        const history = await Message.find(query)
            .populate('pengirim', 'namaLengkap role avatar')
            .populate('penerima', 'namaLengkap role avatar')
            .sort({ createdAt: 1 }); // urut dari terlama ke terbaru (seperti chat asli)

        res.status(200).json({
            pesan: 'Berhasil memuat riwayat chat',
            data: history
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getChatHistory };
