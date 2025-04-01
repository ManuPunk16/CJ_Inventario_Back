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
exports.createInventario = async (req, res) => {
  try {
    const nuevoInventario = new Inventario(req.body);
    const inventarioCreado = await nuevoInventario.save();
    logger.info(`Inventario creado: ${inventarioCreado._id}`);
    res.status(201).json({ status: 'success', data: inventarioCreado });
  } catch (error) {
    logger.error(`Error creating inventario: ${error.message}`);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

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
exports.updateInventario = async (req, res) => {
  try {
    const inventario = await Inventario.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!inventario) {
      return res.status(404).json({ status: 'error', message: 'Inventario no encontrado' });
    }
    res.status(200).json({ status: 'success', data: inventario });
  } catch (error) {
    logger.error(`Error updating inventario: ${error.message}`);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

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
exports.addEntrada = async (req, res) => {
  try {
    const inventario = await Inventario.findById(req.params.id);
    if (!inventario) {
      return res.status(404).json({ status: 'error', message: 'Inventario no encontrado' });
    }

    inventario.entradas.push(req.body);
    inventario.cantidad += req.body.cantidad;
    inventario.fechaActualizacion = Date.now();

    await inventario.save();
    res.status(200).json({ status: 'success', data: inventario });
  } catch (error) {
    logger.error(`Error adding entrada: ${error.message}`);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Agregar una salida al inventario
exports.addSalida = async (req, res) => {
  try {
    const inventario = await Inventario.findById(req.params.id);
    if (!inventario) {
      return res.status(404).json({ status: 'error', message: 'Inventario no encontrado' });
    }

    const { cantidad, motivo, area } = req.body; // Obtener el área del cuerpo de la solicitud

    inventario.salidas.push({
      cantidad,
      motivo,
      area // Agregar el área al objeto de salida
    });
    inventario.cantidad -= cantidad;
    inventario.fechaActualizacion = Date.now();

    await inventario.save();
    res.status(200).json({ status: 'success', data: inventario });
  } catch (error) {
    logger.error(`Error adding salida: ${error.message}`);
    res.status(400).json({ status: 'error', message: error.message });
  }
};