const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');

// --- FUNGSI BANTUAN GENERATE TOKEN ---
const generateTokens = (user) => {
    const payload = { id: user._id, role: user.role }; // Sertakan role agar bisa dibaca middleware
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
    
    return { accessToken, refreshToken };
};

// --- REGISTER ---
const registerUser = async (req, res, next) => {
    try {
        const { email, password, namaLengkap } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, pesan: 'Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        // Menggunakan namaLengkap sesuai dengan model User kita
        const user = await User.create({ namaLengkap, email, password: hashedPassword });

        const { accessToken, refreshToken } = generateTokens(user);

        // Simpan refreshToken ke DB (hashed) untuk keamanan
        user.refreshToken = await bcrypt.hash(refreshToken, 10);
        await user.save();

        res.status(201).json({
            success: true,
            pesan: 'Registrasi berhasil',
            data: { accessToken, refreshToken, user: { id: user._id, namaLengkap: user.namaLengkap, email: user.email, role: user.role } }
        });
    } catch (error) {
        next(error);
    }
};

// --- LOGIN ---
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // Cari user berdasarkan email
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, pesan: 'Email atau password salah' });
        }

        const { accessToken, refreshToken } = generateTokens(user);
        
        // Perbarui refresh token di database
        user.refreshToken = await bcrypt.hash(refreshToken, 10);
        await user.save();

        res.json({
            success: true,
            pesan: 'Login berhasil',
            data: { accessToken, refreshToken, user: { id: user._id, namaLengkap: user.namaLengkap, email: user.email, role: user.role } }
        });
    } catch (error) {
        next(error);
    }
};

// --- REFRESH TOKEN ---
const refreshToken = async (req, res, next) => {
    try {
        // Front-End harus mengirimkan token lama di body JSON
        const { refreshToken: tokenDikirim } = req.body;
        
        if (!tokenDikirim) {
            return res.status(401).json({ success: false, pesan: 'Refresh token tidak ditemukan' });
        }

        const decoded = jwt.verify(tokenDikirim, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !(await bcrypt.compare(tokenDikirim, user.refreshToken))) {
            return res.status(403).json({ success: false, pesan: 'Refresh token tidak valid atau sudah dibatalkan' });
        }

        // Buat pasangan token yang baru
        const tokens = generateTokens(user);
        user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        await user.save();

        res.json({ success: true, data: tokens });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ success: false, pesan: 'Refresh token kadaluarsa, silakan login ulang' });
        }
        next(error);
    }
};

// --- LOGOUT ---
const logoutUser = async (req, res, next) => {
    try {
        // Hapus token dari database agar tidak bisa digunakan lagi
        await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
        res.json({ success: true, pesan: 'Logout berhasil' });
    } catch (error) {
        next(error);
    }
};

// --- FORGOT PASSWORD ---
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, pesan: 'Email tidak ditemukan' });
        }

        // Generate token rahasia menggunakan crypto
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Hash token dan simpan ke database (berlaku 1 jam)
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
        await user.save();

        // URL Reset
        const resetUrl = `http://localhost:3000/ResetPassword?token=${resetToken}`;
        const message = `Anda menerima email ini karena Anda (atau seseorang) meminta reset password untuk akun Anda di StokAja!.\n\nSilakan klik link berikut untuk membuat password baru:\n\n${resetUrl}\n\nLink ini akan kadaluarsa dalam 1 jam.\nJika Anda tidak memintanya, abaikan email ini.`;

        try {
            const sendEmail = require('../utils/sendEmail');
            await sendEmail({
                email: user.email,
                subject: 'StokAja! - Reset Password Token',
                message: message
            });

            res.status(200).json({
                success: true,
                pesan: 'Email reset password telah dikirim ke ' + user.email
            });
        } catch (error) {
            console.error(error);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({ success: false, pesan: 'Email gagal dikirim. Periksa konfigurasi SMTP.' });
        }
    } catch (error) {
        next(error);
    }
};

// --- RESET PASSWORD ---
const resetPassword = async (req, res, next) => {
    try {
        // Ambil token dari param dan cocokan dengan yang di database
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() } // Pastikan token belum expired
        });

        if (!user) {
            return res.status(400).json({ success: false, pesan: 'Token reset password tidak valid atau sudah kadaluarsa' });
        }

        // Set password baru
        user.password = await bcrypt.hash(req.body.password, 12);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ success: true, pesan: 'Password berhasil diubah. Silakan login kembali.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { registerUser, loginUser, refreshToken, logoutUser, forgotPassword, resetPassword };