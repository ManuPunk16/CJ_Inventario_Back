const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');

// Ruta sin protección
router.post(
  '/login',
  [
    body('username', 'El nombre de usuario es requerido').notEmpty(),
    body('password', 'La contraseña es requerida').notEmpty()
  ],
  authController.login.bind(authController)
);

// Ruta sin protección para refrescar token
router.post(
  '/refresh-token',
  authController.refreshToken.bind(authController)
);

// Ruta para cerrar sesión (sin protección)
router.post(
  '/logout',
  authController.logout.bind(authController)
);

// Middleware de autenticación para las rutas siguientes
router.use(authController.verifyToken.bind(authController));

// Registrar un nuevo usuario (protegido, solo admin)
router.post(
  '/register',
  [
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
  authController.getProfile.bind(authController)
);

// Cerrar sesión
router.post(
  '/logout',
  authController.logout.bind(authController)
);

module.exports = router;