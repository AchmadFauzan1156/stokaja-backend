const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // --- MIDDLEWARE AUTENTIKASI ---
    // Logika ini akan berjalan setiap kali ada klien yang mencoba 'Connect'
    io.use((socket, next) => {
        // Front-End harus mengirim token di dalam objek 'auth'
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Akses Ditolak: Token tidak ditemukan."));
        }

        try {
            // Verifikasi token menggunakan JWT_SECRET yang sama dengan API
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Simpan data user ke dalam objek socket agar bisa diakses di fungsi lain
            socket.user = decoded;
            next(); // Izinkan koneksi
        } catch (err) {
            return next(new Error("Akses Ditolak: Token tidak valid atau kadaluarsa."));
        }
    });

    io.on("connection", (socket) => {
        console.log(`📡 User Terkoneksi ke Socket: ${socket.user.id} (${socket.user.role})`);

        // Ketika user mengirim pesan
        socket.on("send_message", async (data) => {
            try {
                // data format: { penerima: "id_admin" (bisa null), pesan: "Isi teks" }
                const Message = require('../models/Message');
                const pesanBaru = new Message({
                    pengirim: socket.user.id,
                    penerima: data.penerima || null,
                    isiPesan: data.pesan
                });
                await pesanBaru.save();

                // Broadcast kembali pesan ke sender dan penerima agar realtime
                // Di sistem riil sebaiknya gabung room, tapi sementara broadcast global (dengan flag)
                io.emit("receive_message", {
                    _id: pesanBaru._id,
                    pengirim: socket.user.id,
                    penerima: data.penerima,
                    isiPesan: data.pesan,
                    createdAt: pesanBaru.createdAt
                });
            } catch (error) {
                console.error("Socket error saat kirim pesan:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log(`🔌 User Terputus: ${socket.user.id}`);
        });
    });

    return io;
};

module.exports = initSocket;