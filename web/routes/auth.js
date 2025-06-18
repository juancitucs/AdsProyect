
// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Ruta de login
router.post('/login', async (req, res) => {
  const { studentCode, password } = req.body;

  if (!studentCode || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    const user = await User.findOne({ _id: studentCode, contrasena: password });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({
      message: 'Login exitoso',
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        tipo: user.tipo
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno al autenticar' });
  }
});

module.exports = router;
