const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const inventarioRoutes = require('./routes/inventario.routes');
const errorHandler = require('./middleware/error.middleware');
const logger = require('./utils/logger');

dotenv.config();

const app = express();

// Conectar a la base de datos
connectDB();

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());

// Rutas del inventario
app.use('/api/inventario', inventarioRoutes);

// Middleware para el manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});