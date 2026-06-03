const crypto = require('crypto');

const buatNomorResi = () => {
    const tanggal = new Date();
    const tahun = tanggal.getFullYear();
    const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
    const hari = String(tanggal.getDate()).padStart(2, '0');
    
    const acak = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    return `TRX-${tahun}${bulan}${hari}-${acak}`;
};

module.exports = buatNomorResi;