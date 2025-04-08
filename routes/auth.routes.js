const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');

// Registrar un nuevo usuario
router.post(
  '/register',
  [
    authController.verifyToken,          // Verificar token
    authController.authorizeRole(['admin']), // Verificar rol admin
    body('username', 'El nombre de usuario es requerido').notEmpty(),
    body('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    body('role', 'El rol debe ser admin o user').isIn(['admin', 'user'])
  ],
  authController.register
);

// Iniciar sesión
router.post(
  '/login',
  [
    body('username', 'El nombre de usuario es requerido').notEmpty(),
    body('password', 'La contraseña es requerida').notEmpty()
  ],
  authController.login
);

module.exports = router;