const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Registra un nuevo usuario
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Error de validación', 
          errors: errors.array() 
        });
      }

      const { username, password, role } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'El usuario ya existe' 
        });
      }

      const newUser = new User({ username, password, role });
      await newUser.save();

      logger.info(`Usuario registrado: ${newUser.username} con rol: ${newUser.role}`);
      
      res.status(201).json({ 
        status: 'success', 
        message: 'Usuario registrado exitosamente',
        data: {
          id: newUser._id,
          username: newUser.username,
          role: newUser.role
        }
      });
    } catch (error) {
      logger.error(`Error al registrar usuario: ${error.message}`);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error al registrar usuario'
      });
    }
  }

  /**
   * Inicia sesión de usuario
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Verificar si el usuario existe
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Credenciales inválidas' 
        });
      }

      // Verificar la contraseña
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Credenciales inválidas' 
        });
      }

      // Generar tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Registrar actividad
      logger.info(`Usuario ${user.username} inició sesión`);
      
      // Responder con tokens e información de usuario
      res.status(200).json({ 
        status: 'success',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      logger.error(`Error al iniciar sesión: ${error.message}`);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error al iniciar sesión' 
      });
    }
  }

  /**
   * Actualiza el token de acceso usando un token de refresco
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Refresh token es requerido' 
        });
      }
      
      // Verificar token de refresco
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      // Buscar usuario para asegurar que existe
      const user = await User.findById(decoded.user.id);
      if (!user) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Usuario no encontrado' 
        });
      }
      
      // Generar nuevo token de acceso
      const accessToken = this.generateAccessToken(user);
      
      res.status(200).json({
        status: 'success',
        accessToken
      });
    } catch (error) {
      logger.error(`Error al refrescar token: ${error.message}`);
      res.status(401).json({ 
        status: 'error', 
        message: 'Token de refresco inválido o expirado' 
      });
    }
  }

  /**
   * Cierra la sesión de usuario (invalidando tokens)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  async logout(req, res) {
    try {
      // Aquí se podría implementar un registro de tokens inválidos
      // o simplemente confiar en la expiración de los tokens
      
      res.status(200).json({
        status: 'success',
        message: 'Sesión cerrada correctamente'
      });
    } catch (error) {
      logger.error(`Error al cerrar sesión: ${error.message}`);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error al cerrar sesión' 
      });
    }
  }

  /**
   * Obtiene información del usuario actual
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      
      if (!user) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Usuario no encontrado' 
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      logger.error(`Error al obtener perfil: ${error.message}`);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error al obtener información del perfil' 
      });
    }
  }

  /**
   * Middleware para verificar token de autenticación
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  async verifyToken(req, res, next) {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'No hay token, autorización denegada' 
        });
      }
      
      // Extraer el token del encabezado "Bearer <token>"
      const token = authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Formato de token inválido' 
        });
      }
      
      // Verificar token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.user = decoded.user;
      next();
    } catch (error) {
      logger.error(`Error al verificar token: ${error.message}`);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Token expirado', 
          code: 'TOKEN_EXPIRED' 
        });
      }
      
      res.status(401).json({ 
        status: 'error', 
        message: 'Token inválido' 
      });
    }
  }

  /**
   * Middleware para verificar rol de usuario
   * @param {Array} roles - Roles permitidos
   * @returns {Function} Middleware
   */
  authorizeRole(roles) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({ 
            status: 'error', 
            message: 'Usuario no autenticado' 
          });
        }
        
        if (!roles.includes(req.user.role)) {
          return res.status(403).json({ 
            status: 'error', 
            message: 'No tiene permisos para acceder a este recurso' 
          });
        }
        
        next();
      } catch (error) {
        logger.error(`Error en autorización de rol: ${error.message}`);
        res.status(500).json({ 
          status: 'error', 
          message: 'Error al verificar permisos' 
        });
      }
    };
  }

  /**
   * Genera token de acceso
   * @param {Object} user - Usuario para el que se genera el token
   * @returns {string} Token JWT
   */
  generateAccessToken(user) {
    return jwt.sign(
      { 
        user: {
          id: user._id,
          role: user.role
        } 
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );
  }

  /**
   * Genera token de refresco
   * @param {Object} user - Usuario para el que se genera el token
   * @returns {string} Token JWT de refresco
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { 
        user: {
          id: user._id,
          role: user.role
        } 
      },
      process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
  }
}

// Exportar una instancia de la clase
module.exports = new AuthController();