const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const inventarioRoutes = require('./routes/inventario.routes');
const errorHandler = require('./middleware/error.middleware');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
// const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

dotenv.config();

const app = express();

const corsOptions = {
  origin: "*", // O una lista de orígenes específicos para mayor seguridad
  methods: "GET, POST, OPTIONS, PUT, DELETE, PATCH",
  allowedHeaders: "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, x-access-token",
  credentials: true 
};

// Conectar a la base de datos
connectDB();

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());
// app.use(xss());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 solicitudes por IP en 15 minutos
  message: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo después de 15 minutos'
});

// Aplicar el middleware a todas las rutas
app.use(limiter);

app.use(cors(corsOptions));

// Middleware para registrar las solicitudes HTTP
app.use(morgan('dev')); // 'dev' es un formato predefinido para desarrollo

// Para producción, puedes usar un formato más detallado y registrar en un archivo:
// const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
// app.use(morgan('combined', { stream: accessLogStream }));

// Rutas del inventario
app.use('/api/inventario', inventarioRoutes);
app.use('/api/auth', authRoutes);

// Middleware para el manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});