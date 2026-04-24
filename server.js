const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const initSocket = require('./config/socket');
const { errorHandler } = require('./middlewares/errorHandler');

const http = require('http');

const app = express();
const server = http.createServer(app);

initSocket(server);

// --- MIDDLEWARE KEAMANAN GLOBAL ---
app.use(helmet());
app.use(cors());
app.use(express.json());

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

app.use('/api', authRoutes);
app.use('/api', productRoutes);
app.use('/api', transactionRoutes);
app.use('/api', userRoutes);

app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
    res.status(404).json({ message: "Endpoint API tidak ditemukan." });
});

app.use(errorHandler);

// --- JALANKAN SERVER ---
server.listen(PORT, () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
});