const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');

router.get('/api/inventario', inventarioController.getAllInventario);
router.post('/api/crear-inventario', inventarioController.createInventario);
router.get('/api/get-inventario/:id', inventarioController.getInventarioById);
router.put('/api/update-inventario/:id', inventarioController.updateInventario);
router.delete('/delete-inventario/:id', inventarioController.deleteInventario);
router.post('/api/inventario-entrada/:id/entradas', inventarioController.addEntrada);
router.post('/api/inventario-salida/:id/salidas', inventarioController.addSalida);

module.exports = router;