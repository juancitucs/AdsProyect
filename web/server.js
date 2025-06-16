
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());       // parsea JSON en body

app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const {
  DB_HOST = 'mongodb',
  DB_PORT = '27017',
  DB_NAME = 'test',
  DB_USER,
  DB_PASSWORD
} = process.env;




const uri = 'mongodb://root:1234@localhost:27017/test?authSource=admin';

// 1) Conexión a MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('🔌 Conectado a MongoDB:', uri))
  .catch(err => console.error('❌ Error al conectar:', err));

// 2) Define el esquema y modelo de Usuario

const userSchema = new mongoose.Schema({
  _id: String, // Código del estudiante como clave primaria
  email: String,
  contrasena: String,
  tipo: String,
  perfil: {
    bio: String,
    foto: String,
    intereses: [String],
  },
}, { collection: 'users' });


const User = mongoose.model('User', userSchema);

// 3) Ruta para obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-contrasena');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer usuarios' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-contrasena');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar usuario' });
  }
});


app.post('/api/users', async (req, res) => {
  try {
    const { nombre, email, contrasena, tipo, perfil } = req.body;
    const nuevo = await User.create({
      _id: nombre, // studentCode como _id
      nombre,
      email,
      contrasena,
      tipo,
      perfil
    });
    res.status(201).json({ message: 'Usuario registrado', id: nuevo._id });
  } catch (err) {
    console.error('Error al registrar:', err);
    res.status(500).json({ error: 'No se pudo registrar' });
  }
});


// 5) Ruta de login (opcional, para tu formulario de login)
app.post('/api/login', async (req, res) => {
  const { studentCode, password } = req.body;
  // Si usaras studentCode en tu documento, ajusta el campo:
  const user = await User.findOne({ _id: studentCode, contrasena: password });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  res.json({ message: 'Login exitoso', user: { nombre: user.nombre, email: user.email } });
});

const PORT = 80;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);
});

