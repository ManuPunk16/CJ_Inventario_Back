const mongoose = require('mongoose');

// Esquema para acciones de auditoría
const auditoriaSchema = new mongoose.Schema({
  usuario: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true }
  },
  fecha: { type: Date, default: Date.now }
});

const ubicacionSchema = new mongoose.Schema({
  edificio: {
    type: String,
    enum: ['ADM', 'TI'],
    required: true,
    uppercase: true,
    default: 'ADM'
  },
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
    required: true
  },
  // Agregar creador y último modificador
  creador: {
    type: auditoriaSchema,
    required: true
  },
  ultimaModificacion: {
    type: auditoriaSchema
  },
  // Modificar entrada para incluir información de auditoría
  entradas: [{
    fecha: { type: Date, default: Date.now },
    cantidad: { type: Number, required: true },
    proveedor: { type: String },
    ubicacionAnterior: ubicacionSchema,
    ubicacionNueva: ubicacionSchema,
    // Quién registró esta entrada
    registradoPor: {
      type: auditoriaSchema,
      required: true
    }
  }],
  // Modificar salida para incluir información de auditoría
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
        'UNIDAD DE TRANSPARENCIA',
        'LIMPIEZA',
      ],
      required: true
    },
    solicitante: { type: String, required: true },
    quienEntrega: { type: String, required: true },
    // Quién registró esta salida
    registradoPor: {
      type: auditoriaSchema,
      required: true
    }
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

// Pre-save middleware para generar automáticamente el código de ubicación
inventarioSchema.pre(['save', 'insertMany'], function(next) {
  // Si es una operación insertMany, aplicar a cada documento
  if (Array.isArray(this)) {
    this.forEach(doc => {
      if (!doc.codigoUbicacion) {
        const ubicacion = doc.ubicacion;
        const edificio = ubicacion.edificio || 'ADM';
        const anaquel = ubicacion.anaquel;
        const nivel = ubicacion.nivel;
        const shortTimestamp = Date.now().toString().slice(-4);
        
        doc.codigoUbicacion = `${edificio}-A${anaquel}-N${nivel}-${shortTimestamp}`;
      }
    });
  } else {
    // Aplicar al documento individual si no tiene código
    if (!this.codigoUbicacion) {
      const ubicacion = this.ubicacion;
      const edificio = ubicacion.edificio || 'ADM';
      const anaquel = ubicacion.anaquel;
      const nivel = ubicacion.nivel;
      const shortTimestamp = Date.now().toString().slice(-4);
      
      this.codigoUbicacion = `${edificio}-A${anaquel}-N${nivel}-${shortTimestamp}`;
    }
  }
  next();
});

// Índices
inventarioSchema.index({ nombre: 1 });
inventarioSchema.index({ tipoMaterial: 1, nombre: 1 });
inventarioSchema.index({ 'ubicacion.anaquel': 1 });
inventarioSchema.index({ 'ubicacion.edificio': 1 });
inventarioSchema.index({ codigoUbicacion: 1 }, { unique: true });
// Nuevos índices para auditoría
inventarioSchema.index({ 'creador.usuario.id': 1 });
inventarioSchema.index({ 'creador.usuario.username': 1 });
inventarioSchema.index({ 'entradas.registradoPor.usuario.id': 1 });
inventarioSchema.index({ 'salidas.registradoPor.usuario.id': 1 });

module.exports = mongoose.model('Inventario', inventarioSchema, 'inventario');