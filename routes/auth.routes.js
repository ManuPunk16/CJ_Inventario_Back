const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');

// Iniciar sesión
router.post(
  '/login',
  [
    body('username', 'El nombre de usuario es requerido').notEmpty(),
    body('password', 'La contraseña es requerida').notEmpty()
  ],
  authController.login.bind(authController)
);

// Registrar un nuevo usuario (protegido, solo admin)
router.post(
  '/register',
  [
    authController.verifyToken.bind(authController),
    authController.authorizeRole(['admin']),
    body('username', 'El nombre de usuario es requerido').notEmpty(),
    body('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    body('role', 'El rol debe ser admin o user').isIn(['admin', 'user'])
  ],
  authController.register.bind(authController)
);

// Obtener perfil del usuario actual
router.get(
  '/profile',
  authController.verifyToken.bind(authController),
  authController.getProfile.bind(authController)
);

// Refrescar token
router.post(
  '/refresh-token',
  authController.refreshToken.bind(authController)
);

// Cerrar sesión
router.post(
  '/logout',
  authController.verifyToken.bind(authController),
  authController.logout.bind(authController)
);

module.exports = router;