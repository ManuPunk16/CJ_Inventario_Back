const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');
const authController = require('../controllers/auth.controller'); // Importar el controlador de autenticación

// Rutas protegidas con autenticación y autorización
router.get('/', authController.verifyToken, inventarioController.getAllInventario); // Requiere autenticación
router.post('/', authController.verifyToken, authController.authorizeRole(['admin']), inventarioController.createInventario); // Requiere autenticación y rol de administrador
router.get('/:id', authController.verifyToken, inventarioController.getInventarioById); // Requiere autenticación
router.put('/:id', authController.verifyToken, authController.authorizeRole(['admin']), inventarioController.updateInventario); // Requiere autenticación y rol de administrador
router.delete('/:id', authController.verifyToken, authController.authorizeRole(['admin']), inventarioController.deleteInventario); // Requiere autenticación y rol de administrador
router.post('/:id/entradas', authController.verifyToken, authController.authorizeRole(['admin']), inventarioController.addEntrada); // Requiere autenticación y rol de administrador
router.post('/:id/salidas', authController.verifyToken, inventarioController.addSalida); // Requiere autenticación

module.exports = router;