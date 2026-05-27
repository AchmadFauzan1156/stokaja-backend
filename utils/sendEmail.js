const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Buat transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2. Definisikan opsi email
    const mailOptions = {
        from: `StokAja! <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html // (Opsional) jika mau format HTML
    };

    // 3. Kirim email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
