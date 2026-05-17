const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

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
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js')
  ],
};

module.exports = swaggerJsdoc(options);