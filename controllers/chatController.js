const Message = require('../models/Message');
const User = require('../models/User');

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
            } else {
                return res.status(400).json({ pesan: 'pelangganId harus disertakan untuk riwayat chat admin', data: [] });
            }
        }

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const skip = (page - 1) * limit;

        const history = await Message.find(query)
            .populate('pengirim', 'namaLengkap role avatar')
            .populate('penerima', 'namaLengkap role avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            pesan: 'Berhasil memuat riwayat chat',
            data: history.reverse()
        });
    } catch (error) {
        next(error);
    }
};

// Daftar pelanggan yang pernah chat (untuk admin melihat list kontak)
const getChatContacts = async (req, res, next) => {
    try {
        // Ambil semua unique pengirim yang role-nya pelanggan
        const contacts = await Message.aggregate([
            // Gabungkan pengirim dan penerima jadi satu list userId
            {
                $group: {
                    _id: null,
                    allUsers: {
                        $addToSet: '$pengirim'
                    },
                    allReceivers: {
                        $addToSet: '$penerima'
                    }
                }
            },
            {
                $project: {
                    userIds: { $setUnion: ['$allUsers', '$allReceivers'] }
                }
            }
        ]);

        if (!contacts.length || !contacts[0].userIds) {
            return res.status(200).json({ pesan: 'Belum ada kontak chat', data: [] });
        }

        // Filter hanya user dengan role pelanggan
        const pelangganList = await User.find({
            _id: { $in: contacts[0].userIds },
            role: 'pelanggan'
        }).select('namaLengkap email avatar');

        const pelangganIds = pelangganList.map(p => p._id);

        // Ambil jumlah unread secara massal
        const unreadCounts = await Message.aggregate([
            { $match: { pengirim: { $in: pelangganIds }, dibaca: false } },
            { $group: { _id: '$pengirim', count: { $sum: 1 } } }
        ]);
        const unreadMap = {};
        unreadCounts.forEach(u => unreadMap[u._id.toString()] = u.count);

        // Ambil pesan terakhir secara massal
        const lastMessages = await Message.aggregate([
            { $match: { $or: [{ pengirim: { $in: pelangganIds } }, { penerima: { $in: pelangganIds } }] } },
            { $sort: { createdAt: -1 } },
            { $group: { 
                _id: { $cond: [{ $in: ['$pengirim', pelangganIds] }, '$pengirim', '$penerima'] }, 
                lastMessage: { $first: '$$ROOT' } 
            }}
        ]);
        const lastMsgMap = {};
        lastMessages.forEach(m => lastMsgMap[m._id.toString()] = m.lastMessage);

        const contactsWithLastMessage = pelangganList.map((pelanggan) => {
            const lastMessage = lastMsgMap[pelanggan._id.toString()];
            const unreadCount = unreadMap[pelanggan._id.toString()] || 0;

            return {
                pelanggan: {
                    _id: pelanggan._id,
                    namaLengkap: pelanggan.namaLengkap,
                    email: pelanggan.email,
                    avatar: pelanggan.avatar
                },
                pesanTerakhir: lastMessage ? lastMessage.isiPesan : null,
                waktuTerakhir: lastMessage ? lastMessage.createdAt : null,
                belumDibaca: unreadCount
            };
        });

        // Urutkan berdasarkan pesan terakhir (terbaru di atas)
        contactsWithLastMessage.sort((a, b) => {
            if (!a.waktuTerakhir) return 1;
            if (!b.waktuTerakhir) return -1;
            return new Date(b.waktuTerakhir) - new Date(a.waktuTerakhir);
        });

        res.status(200).json({
            pesan: 'Berhasil memuat daftar kontak chat',
            data: contactsWithLastMessage
        });
    } catch (error) {
        next(error);
    }
};

// Tandai pesan sebagai sudah dibaca
const markAsRead = async (req, res, next) => {
    try {
        const messageId = req.params.id;

        const messageToCheck = await Message.findById(messageId);
        if (!messageToCheck) {
            return res.status(404).json({ pesan: 'Pesan tidak ditemukan' });
        }

        // SECURITY PATCH (IDOR): Hanya penerima sah (atau admin yang menerima pesan broadcast) yang boleh menandai dibaca
        if (messageToCheck.penerima === null && req.user.role === 'pelanggan') {
            // Pesan ditujukan untuk admin, pelanggan tidak boleh menandai read
            return res.status(403).json({ pesan: 'Akses ditolak' });
        }
        
        if (messageToCheck.penerima !== null && messageToCheck.penerima.toString() !== req.user.id) {
            // Jika ada penerima spesifik, pastikan itu adalah user yang login
            return res.status(403).json({ pesan: 'Akses ditolak' });
        }

        const message = await Message.findByIdAndUpdate(
            messageId,
            { dibaca: true },
            { new: true }
        );

        res.status(200).json({
            pesan: 'Pesan ditandai sudah dibaca',
            data: message
        });
    } catch (error) {
        next(error);
    }
};

// Tandai semua pesan dari pelanggan tertentu sebagai sudah dibaca (bulk)
const markAllAsRead = async (req, res, next) => {
    try {
        const { pelangganId } = req.params;

        const result = await Message.updateMany(
            { pengirim: pelangganId, dibaca: false },
            { dibaca: true }
        );

        res.status(200).json({
            pesan: `${result.modifiedCount} pesan ditandai sudah dibaca`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getChatHistory, getChatContacts, markAsRead, markAllAsRead };
