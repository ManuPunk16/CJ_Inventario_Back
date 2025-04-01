const { body, validationResult } = require('express-validator');
const Inventario = require('../models/inventario.model');
const logger = require('../utils/logger');

// Obtener todos los elementos del inventario
exports.getAllInventario = async (req, res) => {
  try {
    const inventario = await Inventario.find();
    res.status(200).json({ status: 'success', data: inventario });
  } catch (error) {
    logger.error(`Error getting all inventario: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Error al obtener el inventario' });
  }
};

// Crear un nuevo elemento en el inventario
exports.createInventario = [
  // Validaciones
  body('tipoMaterial').isIn(['oficina', 'limpieza', 'varios']).withMessage('Tipo de material inválido'),
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('descripcion').optional().isString().withMessage('La descripción debe ser una cadena de texto'),
  body('cantidad').isInt({ min: 0 }).withMessage('La cantidad debe ser un número entero no negativo'),
  body('unidadMedida').isIn(['pieza', 'litro', 'kilogramo', 'metro', 'gramo', 'mililitro', 'unidad', 'caja', 'paquete', 'rollo', 'otro']).withMessage('Unidad de medida inválida'),
  body('precioUnitario').optional().isFloat({ min: 0 }).withMessage('El precio unitario debe ser un número positivo'),
  body('stockMinimo').optional().isInt({ min: 0 }).withMessage('El stock mínimo debe ser un número entero no negativo'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    try {
      const nuevoInventario = new Inventario(req.body);
      const inventarioCreado = await nuevoInventario.save();
      logger.info(`Inventario creado: ${inventarioCreado._id}`);
      res.status(201).json({ status: 'success', data: inventarioCreado });
    } catch (error) {
      logger.error(`Error creating inventario: ${error.message}`);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
];

// Obtener un elemento del inventario por ID
exports.getInventarioById = async (req, res) => {
  try {
    const inventario = await Inventario.findById(req.params.id);
    if (!inventario) {
      return res.status(404).json({ status: 'error', message: 'Inventario no encontrado' });
    }
    res.status(200).json({ status: 'success', data: inventario });
  } catch (error) {
    logger.error(`Error getting inventario by ID: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Error al obtener el inventario' });
  }
};

// Actualizar un elemento del inventario por ID
exports.updateInventario = [
  // Validaciones
  body('tipoMaterial').optional().isIn(['oficina', 'limpieza', 'varios']).withMessage('Tipo de material inválido'),
  body('nombre').optional().notEmpty().withMessage('El nombre es requerido'),
  body('descripcion').optional().isString().withMessage('La descripción debe ser una cadena de texto'),
  body('cantidad').optional().isInt({ min: 0 }).withMessage('La cantidad debe ser un número entero no negativo'),
  body('unidadMedida').optional().isIn(['pieza', 'litro', 'kilogramo', 'metro', 'gramo', 'mililitro', 'unidad', 'caja', 'paquete', 'rollo', 'otro']).withMessage('Unidad de medida inválida'),
  body('precioUnitario').optional().isFloat({ min: 0 }).withMessage('El precio unitario debe ser un número positivo'),
  body('stockMinimo').optional().isInt({ min: 0 }).withMessage('El stock mínimo debe ser un número entero no negativo'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    try {
      const inventario = await Inventario.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      if (!inventario) {
        return res.status(404).json({ status: 'error', message: 'Inventario no encontrado' });
      }
      logger.info(`Inventario actualizado: ${inventario._id}`);
      res.status(200).json({ status: 'success', data: inventario });
    } catch (error) {
      logger.error(`Error updating inventario: ${error.message}`);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
];

// Eliminar un elemento del inventario por ID
exports.deleteInventario = async (req, res) => {
  try {
    const inventario = await Inventario.findByIdAndDelete(req.params.id);
    if (!inventario) {
      return res.status(404).json({ status: 'error', message: 'Inventario no encontrado' });
    }
    logger.info(`Inventario eliminado: ${req.params.id}`);
    res.status(200).json({ status: 'success', message: 'Inventario eliminado' });
  } catch (error) {
    logger.error(`Error deleting inventario: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Error al eliminar el inventario' });
  }
};

// Agregar una entrada al inventario
exports.addEntrada = [
  // Validaciones
  body('fecha').optional().isISO8601().toDate().withMessage('Fecha inválida'),
  body('cantidad').isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero positivo'),
  body('proveedor').optional().isString().withMessage('El proveedor debe ser una cadena de texto'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    try {
      const inventario = await Inventario.findById(req.params.id);
      if (!inventario) {
        return res.status(404).json({ status: 'error', message: 'Inventario no encontrado' });
      }

      const { fecha, cantidad, proveedor } = req.body;

      inventario.entradas.push({
        fecha,
        cantidad,
        proveedor
      });
      inventario.cantidad += cantidad;
      inventario.fechaActualizacion = Date.now();

      await inventario.save();
      res.status(200).json({ status: 'success', data: inventario });
    } catch (error) {
      logger.error(`Error adding entrada: ${error.message}`);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
];

// Agregar una salida al inventario
exports.addSalida = [
  // Validaciones
  body('hora').notEmpty().withMessage('La hora es requerida'),
  body('cantidad').isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero positivo'),
  body('motivo').notEmpty().withMessage('El motivo es requerido'),
  body('area').isIn(['Administración', 'Contabilidad', 'Comedor', 'Mantenimiento', 'Almacén', 'Producción', 'Ventas', 'Otro']).withMessage('Área inválida'),
  body('solicitante').notEmpty().withMessage('El solicitante es requerido'),
  body('quienEntrega').notEmpty().withMessage('Quien entrega es requerido'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    try {
      const inventario = await Inventario.findById(req.params.id);
      if (!inventario) {
        return res.status(404).json({ status: 'error', message: 'Inventario no encontrado' });
      }

      const { hora, cantidad, motivo, area, solicitante, quienEntrega } = req.body;

      inventario.salidas.push({
        hora,
        cantidad,
        motivo,
        area,
        solicitante,
        quienEntrega
      });
      inventario.cantidad -= cantidad;
      inventario.fechaActualizacion = Date.now();

      await inventario.save();
      res.status(200).json({ status: 'success', data: inventario });
    } catch (error) {
      logger.error(`Error adding salida: ${error.message}`);
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
];