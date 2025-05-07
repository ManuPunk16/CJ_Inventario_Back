/**
 * Manejador centralizado de errores para la API
 * @module errorHandler
 */

const logger = require('./logger');

/**
 * Maneja errores de servidor de manera consistente
 * @param {Object} res - Objeto de respuesta Express
 * @param {Error} error - El error capturado
 * @param {string} message - Mensaje descriptivo del contexto del error
 */
function handleServerError(res, error, message = 'Error en el servidor:') {
  logger.error(`${message} ${error.message}`);
  
  // Errores específicos de MongoDB
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación',
      errors: Object.values(error.errors).map(e => e.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: `Formato inválido para ${error.path}: ${error.value}`
    });
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json({
      status: 'error',
      message: `Valor duplicado para ${field}: ${error.keyValue[field]}`
    });
  }

  // Error genérico
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor'
  });
}

module.exports = {
  handleServerError
};