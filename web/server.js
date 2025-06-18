
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

const {
  DB_HOST = 'mongodb',
  DB_PORT = '27017',
  DB_NAME = 'test',
  DB_USER,
  DB_PASSWORD
} = process.env;

// MongoDB URI

const uri = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
// Conexión a MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('🔌 Conectado a MongoDB');
}).catch(err => {
  console.error('❌ Error al conectar a MongoDB:', err.message);
});

// Rutas API
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

app.use('/api', authRoutes);
app.use('/api/users', userRoutes);

// Servir frontend
app.use(express.static(path.join(__dirname, 'web')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});

