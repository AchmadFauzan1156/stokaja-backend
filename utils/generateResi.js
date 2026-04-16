const buatNomorResi = () => {
    const tanggal = new Date();
    const tahun = tanggal.getFullYear();
    const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
    const hari = String(tanggal.getDate()).padStart(2, '0');
    
    const acak = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    return `TRX-${tahun}${bulan}${hari}-${acak}`;
};

module.exports = buatNomorResi;