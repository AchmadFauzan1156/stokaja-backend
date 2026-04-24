const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const connectDB = require('./config/db');
const initSocket = require('./config/socket');
const { errorHandler } = require('./middlewares/errorHandler');

const http = require('http');

const app = express();
const server = http.createServer(app);

const io = initSocket(server);
app.set('io', io); // Menyimpan instance Socket agar bisa dipanggil dari mana saja

// --- MIDDLEWARE KEAMANAN GLOBAL ---
app.use(helmet());
app.use(cors());
app.use(express.json());

// --- MORGAN (Pencatat Request Klien) ---
app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// --- RATE LIMITER ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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

const API_VERSION = '/api/v1';

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(API_VERSION, authRoutes);
app.use(API_VERSION, productRoutes);
app.use(API_VERSION, transactionRoutes);
app.use(API_VERSION, userRoutes);
app.use(API_VERSION, rawMaterialRoutes);

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