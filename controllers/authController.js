const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const adminBaru = new User({
            email : email,
            password: hashedPassword
        });
        await adminBaru.save();

        res.status(201).json({
            message: 'Admin berhasil daftar',
            data: adminBaru
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal mendaftar',
            error: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user =await User.findOne({email: email});
        if(!user){
            return res.status(404).json({
                message: 'Email tidak ditemukan!'
            });
        }

        const passwordCocok = await bcrypt.compare(password, user.password);
        if(!passwordCocok){
            return res.status(400).json({
                message: 'Password salah!'
            });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login berhasil!',
            token: token
        });
    } catch (error){
        res.status(500).json({
            message: 'Gagal login',
            error: error.message
        });
    }
};

module.exports = {registerUser, loginUser};