const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');
const authController = require('../controllers/auth.controller');

// Aplicar verificación de token a todas las rutas que requieren autenticación
router.use(authController.verifyToken.bind(authController));

// Rutas para gestión de inventario
router.get('/', inventarioController.getAllInventario.bind(inventarioController));
router.post('/', inventarioController.validaciones.crear, inventarioController.createInventario.bind(inventarioController));
router.get('/:id', inventarioController.getInventarioById.bind(inventarioController));
router.put('/:id', inventarioController.validaciones.actualizar, inventarioController.updateInventario.bind(inventarioController));
router.delete('/:id', inventarioController.deleteInventario.bind(inventarioController));

// Rutas para entradas y salidas
router.post('/:id/entradas', inventarioController.validaciones.entrada, inventarioController.addEntrada.bind(inventarioController));
router.post('/:id/salidas', inventarioController.validaciones.salida, inventarioController.addSalida.bind(inventarioController));

// Rutas para entradas y salidas con paginación
router.get('/:id/entradas', inventarioController.getEntradasInventario.bind(inventarioController));
router.get('/:id/salidas', inventarioController.getSalidasInventario.bind(inventarioController));

// Ruta para auditoría
router.get('/:id/auditoria', inventarioController.getAuditoriaInventario.bind(inventarioController));

module.exports = router;