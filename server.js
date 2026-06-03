const compression = require('compression');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
require('dotenv').config();

const connectDB = require('./config/db');
const initSocket = require('./config/socket');
const errorHandler = require('./middlewares/errorHandler');

const http = require('http');

const app = express();

app.set('trust proxy', 1);

const server = http.createServer(app);

const io = initSocket(server);
app.set('io', io); // Menyimpan instance Socket agar bisa dipanggil dari mana saja

// --- MIDDLEWARE KEAMANAN GLOBAL ---
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
        // Izinkan request tanpa origin (mobile apps, curl, dll)
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS tidak diizinkan untuk origin ini'));
        }
    },
    credentials: true // Mengizinkan cookie/header otorisasi
};
app.use(cors(corsOptions));
app.use(express.json());

// OPTIMASI PERFORMA: Mengompresi ukuran respons API menjadi sangat kecil (gzip) sehingga loading Front-End memakan waktu kurang dari 1 detik!
app.use(compression());

// --- MORGAN (Pencatat Request Klien) ---
app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// --- RATE LIMITER ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Diperlonggar untuk endpoint umum
    message: { message: "Terlalu banyak request dari IP ini, silakan coba lagi setelah 15 menit." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

// --- KONEKSI DATABASE ---
const PORT = process.env.PORT || 5000;
connectDB();

// --- ROUTING ---
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');
const rawMaterialRoutes = require('./routes/rawMaterialRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const API_VERSION = '/api/v1';

app.use(API_VERSION, authRoutes);
app.use(API_VERSION, productRoutes);
app.use(API_VERSION, transactionRoutes);
app.use(`${API_VERSION}/users`, userRoutes);
app.use(API_VERSION, rawMaterialRoutes);
app.use(API_VERSION, categoryRoutes);
app.use(API_VERSION, paymentMethodRoutes);
app.use(API_VERSION, adminRoutes);
app.use(API_VERSION, chatRoutes);
app.use(API_VERSION, dashboardRoutes);

app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
    res.status(404).json({ message: "Endpoint API tidak ditemukan." });
});

app.use(errorHandler);

// --- JALANKAN SERVER ---
// HANYA jalankan server.listen jika BUKAN sedang melakukan testing
if (process.env.NODE_ENV !== 'test') {
    server.listen(process.env.PORT || 5000, () => {
        console.log(`🚀 Server berjalan di port ${process.env.PORT || 5000}`);
    });
}

// WAJIB DIEKSPOR agar bisa dibaca oleh Supertest
module.exports = app;