const authorizeRoles = (...rolesDiiZinkan) => {
    return (req, res, next) => {
        if (!req.user || !rolesDiiZinkan.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Akses Ditolak! Fitur ini hanya untuk role: ${rolesDiiZinkan.join(' atau ')}.` 
            });
        }
        next();
    };
};

module.exports = { authorizeRoles };