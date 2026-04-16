const socketIo = require('socket.io');

const initSocket = (server) => {
    const io = socketIo(server, {
        cors: { origin: '*' }
    });

    io.on('connection', (socket) => {
        console.log(`📡 Walkie-Talkie Terhubung: ID ${socket.id}`);

        socket.on('gabungRuangan', (namaRuangan) => {
            socket.join(namaRuangan);
            console.log(`🔑 User ${socket.id} masuk ke ruangan: ${namaRuangan}`);
        });

        socket.on('kirimPesanPrivate', (dataMentah) => {
            try {
                let data = typeof dataMentah === 'string' ? JSON.parse(dataMentah) : dataMentah;
                console.log(`💬 Pesan di [${data.ruangan}] dari ${data.pengirim}: ${data.teks}`);
                io.to(data.ruangan).emit('pesanBaru', data);
            } catch (error) {
                console.log("❌ Server bingung, format pesan bukan JSON yang benar:", dataMentah);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Walkie-Talkie Terputus: ID ${socket.id}`);
        });
    });

    return io;
};

module.exports = initSocket;