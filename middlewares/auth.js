const jwt = require('jsonwebtoken');

const verifikasiToken = (req, res, next) => {
    const token = req.header('Authorization');

    if(!token){
        return res.status(401).json({
            message: 'Akses ditolak! Anda harus login (bawa token)'
        });
    }

    try {
        const tokenAsli = token.split(' ')[1];

        const dataUser = jwt.verify(tokenAsli, process.env.JWT_SECRET);

        req.user = dataUser;

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Token invalid atau sudah expired'
        });
    }
};

module.exports = verifikasiToken;