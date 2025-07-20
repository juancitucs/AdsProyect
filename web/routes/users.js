
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post'); // Import Post model
const authenticateToken = require('../middleware/auth'); // Import auth middleware

// --- Public Routes ---

// Obtener todos los usuarios (sin password)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});



router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const { nombre, bio, foto } = req.body;
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (bio) updateData['perfil.bio'] = bio;
    if (foto) updateData['perfil.foto'] = foto;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

// New: Add/Remove favorite courses
router.patch('/favorites', authenticateToken, async (req, res) => {
  try {
    const { course, action } = req.body; // action can be 'add' or 'remove'
    if (!course || !action) {
      return res.status(400).json({ error: 'Course and action are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (action === 'add') {
      if (!user.favoritos.includes(course)) {
        user.favoritos.push(course);
      }
    } else if (action === 'remove') {
      user.favoritos = user.favoritos.filter(fav => fav !== course);
    } else {
      return res.status(400).json({ error: "Invalid action. Must be 'add' or 'remove'." });
    }

    await user.save();
    res.json({ message: 'Favorites updated successfully.', favoritos: user.favoritos });
  } catch (err) {
    console.error('Error updating favorites:', err);
    res.status(500).json({ error: 'Error al actualizar favoritos.' });
  }
});





// --- Authenticated Routes ---

// Get current logged-in user's profile
router.get('/me', authenticateToken, async (req, res) => {
  console.log('SERVER: /api/users/me route handler hit!');
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Error al obtener el perfil del usuario actual' });
  }
});



router.get('/:id', authenticateToken, async (req, res) => {
  const isOwn = req.user && req.user.id === req.params.id;
  const projection = isOwn
    ? '-password'              // completo (sin password)
    : '-password -email';      // oculta email a terceros

  try {
    const user = await User.findById(req.params.id).select(projection);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar usuario' });
  }
});

// Get all posts by a specific user
router.get('/:id/posts', async (req, res) => {
  try {
    const posts = await Post.find({ autor: req.params.id }).sort({ time: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ error: 'Error fetching user posts' });
  }
});

// Update current logged-in user's profile

// --- Registration (Public) ---

// Crear nuevo usuario (registro)
router.post('/', async (req, res) => {
  try {
    const { studentCode, nombre, email, password, tipo, perfil } = req.body;

    // Validar campos mínimos
    if (!studentCode || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Verificar que el código no exista
    const existe = await User.findById(studentCode);
    if (existe) {
      return res.status(400).json({ error: 'Código ya registrado' });
    }

    // Crear usuario
    const nuevoUsuario = await User.create({
      _id: studentCode,
      nombre,
      email,
      password,
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


