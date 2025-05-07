const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');

// Rutas para gestión de inventario
router.get('/', inventarioController.getAllInventario.bind(inventarioController));
router.post('/', inventarioController.validaciones.crear, inventarioController.createInventario.bind(inventarioController));
router.get('/:id', inventarioController.getInventarioById.bind(inventarioController));
router.put('/:id', inventarioController.validaciones.actualizar, inventarioController.updateInventario.bind(inventarioController));
router.delete('/:id', inventarioController.deleteInventario.bind(inventarioController));

// Rutas para entradas y salidas
router.post('/:id/entradas', inventarioController.validaciones.entrada, inventarioController.addEntrada.bind(inventarioController));
router.post('/:id/salidas', inventarioController.validaciones.salida, inventarioController.addSalida.bind(inventarioController));

module.exports = router;