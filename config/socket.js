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

        // USER JOIN KE ROOM SESUAI ID MEREKA
        socket.join(socket.user.id);

        // Jika user adalah admin/kasir, gabungkan mereka ke room khusus admin
        if (socket.user.role === 'admin' || socket.user.role === 'kasir') {
            socket.join("admin_room");
        }

        // Ketika user mengirim pesan
        socket.on("send_message", async (data) => {
            try {
                // SECURITY: Batasi panjang pesan teks maksimal 1000 karakter
                if (data.pesan && data.pesan.length > 1000) {
                    return socket.emit("pesan_error", { message: "Pesan terlalu panjang (maksimal 1000 karakter)." });
                }

                // data format: { penerima: "id_admin" (bisa null), pesan: "Isi teks" }
                const Message = require('../models/Message');
                const pesanBaru = new Message({
                    pengirim: socket.user.id,
                    penerima: data.penerima || null,
                    isiPesan: data.pesan
                });
                await pesanBaru.save();

                // Broadcast spesifik (ke sender dan penerima saja, bukan global)
                const payload = {
                    _id: pesanBaru._id,
                    pengirim: socket.user.id,
                    penerima: data.penerima,
                    isiPesan: data.pesan,
                    createdAt: pesanBaru.createdAt
                };

                // Kirim balik ke pengirim (supaya muncul di layar mereka)
                socket.emit("receive_message", payload);

                // Kirim ke penerima jika ada ID-nya (dan penerima sedang online)
                if (data.penerima) {
                    io.to(data.penerima).emit("receive_message", payload);
                } else {
                    // Jika penerima null (Admin secara general), kirim ke semua admin
                    io.to("admin_room").emit("receive_message", payload);
                }

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