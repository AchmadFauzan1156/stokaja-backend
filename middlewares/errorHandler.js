const logger = require("../utils/logger");

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id || "unauthenticated",
    });
  }

  // Mongoose: validasi gagal
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Data tidak valid",
      errors: messages,
    });
  }

  // Mongoose: duplicate key (misalnya email sudah ada)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} sudah digunakan, gunakan yang lain`,
    });
  }

  // Mongoose: ID tidak valid
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "ID tidak valid",
    });
  }

  // JWT: token tidak valid
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid, silakan login kembali",
    });
  }

  // JWT: token kadaluarsa
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token kadaluarsa, silakan login kembali",
    });
  }

  // Multer: file terlalu besar
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Ukuran file terlalu besar, maksimal 2MB",
    });
  }

  // Multer: tipe file tidak diizinkan
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Tipe file tidak diizinkan",
    });
  }

  // Di production, sembunyikan detail error internal
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Terjadi kesalahan pada server, silakan coba lagi"
      : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;