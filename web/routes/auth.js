
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use environment variable or a placeholder

// Ruta de login usando código de estudiante
router.post('/login', async (req, res) => {
  const { studentCode, password } = req.body;

  // Validamos que vengan ambos campos
  if (!studentCode || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    // Buscamos por _id (studentCode) y password en la BD
    const user = await User.findOne({ _id: studentCode, password });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    // Devolvemos sólo los datos esenciales y el token
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        tipo: user.tipo
      }
    });
  } catch (err) {
    console.error('Error al autenticar:', err);
    res.status(500).json({ error: 'Error interno al autenticar' });
  }
});

const authenticateToken = require('../middleware/auth');

router.get('/me', authenticateToken, async (req, res) => {
  try {
    console.log('req.user.id:', req.user.id);
    const user = await User.findById(req.user.id).select('nombre email tipo perfil');
    console.log('User found:', user);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Error in /api/me:', err);
    res.status(500).json({ error: 'Error al buscar usuario' });
  }
});

module.exports = router;

