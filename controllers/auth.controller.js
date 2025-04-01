const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Registrar un nuevo usuario
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body; // Obtener el rol del cuerpo de la solicitud

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'El usuario ya existe' });
    }

    const newUser = new User({ username, password, role }); // Pasar el rol al crear el usuario
    await newUser.save();

    logger.info(`Usuario registrado: ${newUser.username} con rol: ${newUser.role}`);
    res.status(201).json({ status: 'success', message: 'Usuario registrado exitosamente' });
  } catch (error) {
    logger.error(`Error al registrar usuario: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Error al registrar usuario' });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verificar si el usuario existe
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    // Verificar la contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }, // Tiempo de expiración del token
      (err, token) => {
        if (err) throw err;
        logger.info(`Usuario ${user.username} inició sesión`);
        res.status(200).json({ status: 'success', token });
      }
    );
  } catch (error) {
    logger.error(`Error al iniciar sesión: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Error al iniciar sesión' });
  }
};

// Middleware para verificar el token JWT
exports.verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ status: 'error', message: 'No hay token, autorización denegada' });
  }

  const token = authHeader.split(' ')[1]; // Extraer el token del encabezado "Bearer <token>"

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Token inválido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error('Error al verificar el token:', error.message); // Agregar log de error
    res.status(401).json({ status: 'error', message: 'Token inválido' });
  }
};

// Middleware para verificar el rol del usuario
exports.authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'No tiene permisos para acceder a este recurso' });
    }
    next();
  };
};