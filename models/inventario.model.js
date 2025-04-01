const mongoose = require('mongoose');

const inventarioSchema = new mongoose.Schema({
  tipoMaterial: {
    type: String,
    enum: ['oficina', 'limpieza', 'varios'],
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: false
  },
  cantidad: {
    type: Number,
    required: true,
    default: 0
  },
  unidadMedida: {
    type: String,
    required: true,
    enum: ['pieza', 'litro', 'kilogramo', 'metro', 'gramo', 'mililitro', 'unidad', 'caja', 'paquete', 'rollo', 'otro']
  },
  precioUnitario: {
    type: Number,
    required: false,
    default: 0
  },
  stockMinimo: {
    type: Number,
    default: 0
  },
  entradas: [{
    fecha: { type: Date, default: Date.now },
    cantidad: { type: Number, required: true },
    proveedor: { type: String }
  }],
  salidas: [{
    fecha: { type: Date, default: Date.now },
    hora: { type: String, required: true },
    cantidad: { type: Number, required: true },
    motivo: { type: String },
    area: { type: String },
    solicitante: { type: String, required: true },
    quienEntrega: { type: String, required: true }
  }],
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  }
});

// Crear índices
inventarioSchema.index({ nombre: 1 }); // Ejemplo: índice en el campo 'nombre'
inventarioSchema.index({ tipoMaterial: 1, nombre: 1 }); // Ejemplo: índice compuesto

module.exports = mongoose.model('Inventario', inventarioSchema, 'inventario');