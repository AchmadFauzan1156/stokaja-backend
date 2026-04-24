const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
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
        // Sekarang kita tahu siapa yang terhubung
        console.log(`📡 User Terkoneksi ke Socket: ${socket.user.id} (${socket.user.role})`);

        socket.on("disconnect", () => {
            console.log(`🔌 User Terputus: ${socket.user.id}`);
        });
    });

    return io;
};

module.exports = initSocket;