const { body, validationResult } = require("express-validator");
const Inventario = require("../models/inventario.model");
const logger = require("../utils/logger");
const { handleServerError } = require("../utils/errorHandler");
const { AREAS, TIPO_MATERIAL, UNIDAD_MEDIDA } = require("../utils/enums");

// Función de utilidad para generar códigos de ubicación
function generarCodigoUbicacion(ubicacion) {
  const edificio = ubicacion.edificio || 'ADM';
  const anaquel = ubicacion.anaquel;
  const nivel = ubicacion.nivel;
  const shortTimestamp = Date.now().toString().slice(-4);
  
  return `${edificio}-A${anaquel}-N${nivel}-${shortTimestamp}`;
}

class InventarioController {
  /**
   * Obtiene todos los elementos del inventario con paginación y búsqueda
   */
  async getAllInventario(req, res) {
    try {
      const page = parseInt(req.query.page) || 0;
      const pageSize = parseInt(req.query.pageSize) || 25;
      const skip = page * pageSize;
      const search = req.query.search || "";

      // Crear query de búsqueda si existe
      const query = {};
      if (search) {
        query.$or = [
          { nombre: { $regex: search, $options: "i" } },
          { tipoMaterial: { $regex: search, $options: "i" } },
          { codigoUbicacion: { $regex: search, $options: "i" } },
        ];
      }

      // Obtener total de documentos con el filtro
      const total = await Inventario.countDocuments(query);

      // Obtener items paginados
      const inventario = await Inventario.find(query)
        .skip(skip)
        .limit(pageSize)
        .sort({ fechaActualizacion: -1 });

      res.status(200).json({
        status: "success",
        items: inventario,
        totalItems: total,
        page,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      handleServerError(res, error, "Error al obtener inventario:");
    }
  }

  /**
   * Obtiene un elemento del inventario por ID
   */
  async getInventarioById(req, res) {
    try {
      const inventario = await Inventario.findById(req.params.id);

      if (!inventario) {
        return res.status(404).json({
          status: "error",
          message: "Inventario no encontrado",
        });
      }

      res.status(200).json({
        status: "success",
        data: inventario,
      });
    } catch (error) {
      handleServerError(res, error, "Error al obtener inventario por ID:");
    }
  }

  /**
   * Crea un nuevo elemento en el inventario
   */
  async createInventario(req, res) {
    try {
      // Validar entrada de datos
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Error de validación",
          errors: errors.array().map(err => err.msg),
        });
      }

      // Garantizar que el objeto tenga un código de ubicación válido
      if (!req.body.codigoUbicacion || !req.body.codigoUbicacion.trim()) {
        req.body.codigoUbicacion = generarCodigoUbicacion(req.body.ubicacion);
      }

      const inventario = await Inventario.create(req.body);
      
      logger.info(`Nuevo inventario creado: ${inventario._id}`);
      res.status(201).json({
        status: "success",
        data: inventario,
      });
    } catch (error) {
      handleServerError(res, error, "Error al crear inventario:");
    }
  }

  /**
   * Actualiza un elemento del inventario por ID
   */
  async updateInventario(req, res) {
    try {
      // Validar entrada de datos
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      // Obtener el artículo actual para verificar si cambió la ubicación
      const inventarioActual = await Inventario.findById(req.params.id);
      
      if (!inventarioActual) {
        return res.status(404).json({
          status: "error",
          message: "Inventario no encontrado",
        });
      }
      
      const updatedData = {
        ...req.body,
        fechaActualizacion: Date.now(),
      };
      
      // Verificar si la ubicación ha cambiado
      let ubicacionCambiada = false;
      
      if (updatedData.ubicacion) {
        const ubicacionActual = inventarioActual.ubicacion;
        const nuevaUbicacion = updatedData.ubicacion;
        
        if (
          (nuevaUbicacion.edificio && nuevaUbicacion.edificio !== ubicacionActual.edificio) ||
          (nuevaUbicacion.anaquel && nuevaUbicacion.anaquel !== ubicacionActual.anaquel) ||
          (nuevaUbicacion.nivel && nuevaUbicacion.nivel !== ubicacionActual.nivel)
        ) {
          ubicacionCambiada = true;
          
          // Generar nuevo código de ubicación
          const edificio = nuevaUbicacion.edificio || ubicacionActual.edificio;
          const anaquel = nuevaUbicacion.anaquel || ubicacionActual.anaquel;
          const nivel = nuevaUbicacion.nivel || ubicacionActual.nivel;
          const shortTimestamp = Date.now().toString().slice(-4);
          
          updatedData.codigoUbicacion = `${edificio}-A${anaquel}-N${nivel}-${shortTimestamp}`;
          
          // Registrar el cambio de ubicación en las entradas
          if (!updatedData.entradas) {
            updatedData.entradas = inventarioActual.entradas || [];
          }
          
          updatedData.entradas.push({
            fecha: new Date(),
            cantidad: inventarioActual.cantidad,
            ubicacionAnterior: {
              edificio: ubicacionActual.edificio,
              anaquel: ubicacionActual.anaquel,
              nivel: ubicacionActual.nivel
            },
            ubicacionNueva: {
              edificio: edificio,
              anaquel: anaquel,
              nivel: nivel
            }
          });
        }
      }

      const inventario = await Inventario.findByIdAndUpdate(
        req.params.id,
        updatedData,
        {
          new: true,
          runValidators: true,
        }
      );

      logger.info(`Inventario actualizado: ${inventario._id}`);
      res.status(200).json({
        status: "success",
        data: inventario,
      });
    } catch (error) {
      handleServerError(res, error, "Error al actualizar inventario:");
    }
  }

  /**
   * Elimina un elemento del inventario por ID
   */
  async deleteInventario(req, res) {
    try {
      const inventario = await Inventario.findByIdAndDelete(req.params.id);

      if (!inventario) {
        return res.status(404).json({
          status: "error",
          message: "Inventario no encontrado",
        });
      }

      logger.info(`Inventario eliminado: ${req.params.id}`);
      res.status(200).json({
        status: "success",
        message: "Inventario eliminado correctamente",
      });
    } catch (error) {
      handleServerError(res, error, "Error al eliminar inventario:");
    }
  }

  /**
   * Agrega una entrada al inventario
   */
  async addEntrada(req, res) {
    try {
      // Validar entrada de datos
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const inventario = await Inventario.findById(req.params.id);

      if (!inventario) {
        return res.status(404).json({
          status: "error",
          message: "Inventario no encontrado",
        });
      }

      const { fecha, cantidad, proveedor } = req.body;

      // Agregar entrada
      inventario.entradas.push({
        fecha: fecha || new Date(),
        cantidad,
        proveedor,
      });

      // Actualizar stock y fecha
      inventario.cantidad += cantidad;
      inventario.fechaActualizacion = Date.now();

      await inventario.save();

      logger.info(
        `Entrada agregada al inventario: ${inventario._id}, cantidad: ${cantidad}`
      );
      res.status(200).json({
        status: "success",
        data: inventario,
      });
    } catch (error) {
      handleServerError(res, error, "Error al agregar entrada:");
    }
  }

  /**
   * Agrega una salida al inventario
   */
  async addSalida(req, res) {
    try {
      // Validar entrada de datos
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          errors: errors.array(),
        });
      }

      const inventario = await Inventario.findById(req.params.id);

      if (!inventario) {
        return res.status(404).json({
          status: "error",
          message: "Inventario no encontrado",
        });
      }

      const { hora, cantidad, motivo, area, solicitante, quienEntrega } =
        req.body;

      // Verificar si hay suficiente stock
      if (inventario.cantidad < cantidad) {
        return res.status(400).json({
          status: "error",
          message: `Stock insuficiente. Disponible: ${inventario.cantidad}`,
        });
      }

      // Agregar salida
      inventario.salidas.push({
        fecha: new Date(),
        hora,
        cantidad,
        motivo,
        area,
        solicitante,
        quienEntrega,
      });

      // Actualizar stock y fecha
      inventario.cantidad -= cantidad;
      inventario.fechaActualizacion = Date.now();

      await inventario.save();

      logger.info(
        `Salida registrada para inventario: ${inventario._id}, cantidad: ${cantidad}`
      );
      res.status(200).json({
        status: "success",
        data: inventario,
      });
    } catch (error) {
      handleServerError(res, error, "Error al agregar salida:");
    }
  }

  /**
   * Validadores para el controlador de inventario
   */
  get validaciones() {
    return {
      crear: [
        body("tipoMaterial")
          .isIn(Object.values(TIPO_MATERIAL))
          .withMessage(
            `Tipo de material inválido. Opciones válidas: ${Object.values(
              TIPO_MATERIAL
            ).join(", ")}`
          ),
        body("nombre").notEmpty().withMessage("El nombre es requerido").trim(),
        body("descripcion")
          .optional()
          .isString()
          .withMessage("La descripción debe ser una cadena de texto")
          .trim(),
        body("cantidad")
          .isInt({ min: 0 })
          .withMessage("La cantidad debe ser un número entero no negativo"),
        body("unidadMedida")
          .isIn(Object.values(UNIDAD_MEDIDA))
          .withMessage(
            `Unidad de medida inválida. Opciones válidas: ${Object.values(
              UNIDAD_MEDIDA
            ).join(", ")}`
          ),
        body("precioUnitario")
          .optional()
          .isFloat({ min: 0 })
          .withMessage("El precio unitario debe ser un número positivo"),
        body("stockMinimo")
          .optional()
          .isInt({ min: 0 })
          .withMessage("El stock mínimo debe ser un número entero no negativo"),
        body("ubicacion.edificio")
          .isIn(['ADM', 'TI'])
          .withMessage("La ubicación debe ser ADM (Administración) o TI (Tecnologías de la Información)"),
        body("ubicacion.anaquel")
          .notEmpty()
          .withMessage("El anaquel es requerido")
          .trim(),
        body("ubicacion.nivel")
          .isInt({ min: 1 })
          .withMessage("El nivel debe ser un número entero positivo"),
      ],
      actualizar: [
        body("tipoMaterial")
          .optional()
          .isIn(Object.values(TIPO_MATERIAL))
          .withMessage(
            `Tipo de material inválido. Opciones válidas: ${Object.values(
              TIPO_MATERIAL
            ).join(", ")}`
          ),
        body("nombre")
          .optional()
          .notEmpty()
          .withMessage("El nombre es requerido")
          .trim(),
        body("descripcion")
          .optional()
          .isString()
          .withMessage("La descripción debe ser una cadena de texto")
          .trim(),
        body("cantidad")
          .optional()
          .isInt({ min: 0 })
          .withMessage("La cantidad debe ser un número entero no negativo"),
        body("unidadMedida")
          .optional()
          .isIn(Object.values(UNIDAD_MEDIDA))
          .withMessage(
            `Unidad de medida inválida. Opciones válidas: ${Object.values(
              UNIDAD_MEDIDA
            ).join(", ")}`
          ),
        body("precioUnitario")
          .optional()
          .isFloat({ min: 0 })
          .withMessage("El precio unitario debe ser un número positivo"),
        body("stockMinimo")
          .optional()
          .isInt({ min: 0 })
          .withMessage("El stock mínimo debe ser un número entero no negativo"),
        body("ubicacion.edificio")
          .optional()
          .isIn(['ADM', 'TI'])
          .withMessage("La ubicación debe ser ADM (Administración) o TI (Tecnologías de la Información)"),
        body("ubicacion.anaquel")
          .optional()
          .notEmpty()
          .withMessage("El anaquel es requerido")
          .trim(),
        body("ubicacion.nivel")
          .optional()
          .isInt({ min: 1 })
          .withMessage("El nivel debe ser un número entero positivo"),
      ],
      entrada: [
        body("fecha")
          .optional()
          .isISO8601()
          .toDate()
          .withMessage("Fecha inválida"),
        body("cantidad")
          .isInt({ min: 1 })
          .withMessage("La cantidad debe ser un número entero positivo"),
        body("proveedor")
          .optional()
          .isString()
          .withMessage("El proveedor debe ser una cadena de texto"),
      ],
      salida: [
        body("hora").notEmpty().withMessage("La hora es requerida"),
        body("cantidad")
          .isInt({ min: 1 })
          .withMessage("La cantidad debe ser un número entero positivo"),
        body("motivo").notEmpty().withMessage("El motivo es requerido"),
        body("area")
          .isIn(Object.values(AREAS))
          .withMessage(
            `Área inválida. Opciones válidas: ${Object.values(AREAS).join(
              ", "
            )}`
          ),
        body("solicitante")
          .notEmpty()
          .withMessage("El solicitante es requerido"),
        body("quienEntrega")
          .notEmpty()
          .withMessage("Quien entrega es requerido"),
      ],
    };
  }
}

// Exportar una instancia de la clase
module.exports = new InventarioController();
