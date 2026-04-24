const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StokAja! API',
      version: '1.0.0',
      description: 'Dokumentasi interaktif Backend API untuk aplikasi kasir dan inventaris StokAja!'
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  // Swagger akan otomatis membaca komentar dari file-file ini
  apis: ['./routes/*.js', './controllers/*.js'],
};

module.exports = swaggerJsdoc(options);