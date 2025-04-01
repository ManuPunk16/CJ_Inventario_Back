const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack); // Registrar el error

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack, // No mostrar el stack en producción
  });
};

module.exports = errorHandler;