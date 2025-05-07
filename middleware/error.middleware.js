const logger = require('../utils/logger');

/**
 * Middleware para manejo centralizado de errores
 */
function errorMiddleware(err, req, res, next) {
  // Registrar error
  logger.error(`Error no capturado: ${err.stack}`);
  
  // Determinar código de estado HTTP
  const statusCode = err.statusCode || 500;
  
  // Construir respuesta
  const errorResponse = {
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message
  };
  
  // Incluir pila en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
}

module.exports = errorMiddleware;