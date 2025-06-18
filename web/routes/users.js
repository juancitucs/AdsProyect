
// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Obtener todos los usuarios (sin contraseñas)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-contrasena');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-contrasena');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar usuario' });
  }
});

// Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { studentCode, nombre, email, contrasena, tipo, perfil } = req.body;

    // Validar campos mínimos
    if (!studentCode || !email || !contrasena) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const existe = await User.findById(studentCode);
    if (existe) return res.status(400).json({ error: 'Código ya registrado' });

    const nuevoUsuario = await User.create({
      _id: studentCode,
      nombre,
      email,
      contrasena,
      tipo,
      perfil
    });

    res.status(201).json({ message: 'Usuario registrado', id: nuevoUsuario._id });
  } catch (err) {
    console.error('Error al registrar usuario:', err.message);
    res.status(500).json({ error: 'No se pudo registrar usuario' });
  }
});

module.exports = router;
