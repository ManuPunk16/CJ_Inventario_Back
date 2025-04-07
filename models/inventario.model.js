const mongoose = require('mongoose');

const ubicacionSchema = new mongoose.Schema({
  anaquel: {
    type: String,
    required: true,
    uppercase: true
  },
  nivel: {
    type: Number,
    required: true,
    min: 1
  },
  observaciones: {
    type: String,
    uppercase: true
  }
});

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
  ubicacion: {
    type: ubicacionSchema,
    required: true
  },
  codigoUbicacion: {
    type: String,
    // unique: true,
    required: true
  },
  entradas: [{
    fecha: { type: Date, default: Date.now },
    cantidad: { type: Number, required: true },
    proveedor: { type: String },
    ubicacionAnterior: ubicacionSchema,
    ubicacionNueva: ubicacionSchema
  }],
  salidas: [{
    fecha: { type: Date, default: Date.now },
    hora: { type: String, required: true },
    cantidad: { type: Number, required: true },
    motivo: { type: String },
    area: {
      type: String,
      enum: [
        'CONSEJERO JURÍDICO',
        'SECRETARIA PARTICULAR Y DE COMUNICACIÓN SOCIAL',
        'DIRECCIÓN DE COORDINACIÓN Y CONTROL DE GESTIÓN',
        'DIRECCIÓN GENERAL DE LO CONTENCIOSO',
        'DIRECCIÓN DE ASISTENCIA TÉCNICA Y COMBATE A LA CORRUPCIÓN',
        'DIRECCIÓN DE SERVICIOS LEGALES',
        'DIRECCIÓN GENERAL CONSULTIVA',
        'DIRECCIÓN DE ESTUDIOS LEGISLATIVOS',
        'DIRECCIÓN DE ESTUDIOS JURÍDICOS',
        'DIRECCIÓN DE COMPILACIÓN NORMATIVA, ARCHIVO E IGUALDAD DE GÉNERO',
        'DIRECCIÓN ADMINISTRATIVA',
        'UNIDAD DE TRANSPARENCIA'
      ],
      required: true
    },
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

// Middleware para generar automáticamente el código de ubicación
inventarioSchema.pre('save', function(next) {
  if (!this.codigoUbicacion) {
    const ubicacion = this.ubicacion;
    // Formato: ANA-NIV
    // Ejemplo: A01-N1
    this.codigoUbicacion = `${ubicacion.anaquel}-N${ubicacion.nivel}`;
  }
  next();
});

// Índices
inventarioSchema.index({ nombre: 1 });
inventarioSchema.index({ tipoMaterial: 1, nombre: 1 });
inventarioSchema.index({ 'ubicacion.anaquel': 1 });
inventarioSchema.index({ codigoUbicacion: 1 }, { unique: true });

module.exports = mongoose.model('Inventario', inventarioSchema, 'inventario');