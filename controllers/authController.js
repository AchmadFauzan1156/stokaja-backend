const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nama, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ nama, email, password: hashedPassword });

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Simpan refreshToken ke DB (hashed) untuk invalidasi
    await User.findByIdAndUpdate(user._id, { refreshToken: await bcrypt.hash(refreshToken, 10) });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: { accessToken, refreshToken, user: { id: user._id, nama: user.nama, email: user.email } }
    });
  } catch (error) {
    next(error); // Lempar ke global error handler
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: await bcrypt.hash(refreshToken, 10) });

    res.json({
      success: true,
      data: { accessToken, refreshToken, user: { id: user._id, nama: user.nama, email: user.email } }
    });
  } catch (error) {
    next(error);
  }
};

// Endpoint baru: POST /api/v1/refresh-token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token tidak ditemukan' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
      return res.status(403).json({ success: false, message: 'Refresh token tidak valid' });
    }

    const tokens = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: await bcrypt.hash(tokens.refreshToken, 10) });

    res.json({ success: true, data: tokens });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, message: 'Refresh token kadaluarsa, silakan login ulang' });
    }
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.json({ success: true, message: 'Logout berhasil' });
  } catch (error) {
    next(error);
  }
};