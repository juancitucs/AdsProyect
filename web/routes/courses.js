
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const authenticateToken = require('../middleware/auth'); // Import the middleware

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Error al obtener los cursos' });
  }
});

// Middleware to check for admin/moderator role
const checkAdminOrModerator = (req, res, next) => {
  if (req.user && (req.user.tipo === 'admin' || req.user.tipo === 'moderator')) {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador o moderador.' });
  }
};

// Add a new course (Admin/Moderator only)
router.post('/', authenticateToken, checkAdminOrModerator, async (req, res) => {
  try {
    const { _id, nombre, descripcion } = req.body;
    if (!_id || !nombre || !descripcion) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: _id, nombre, descripcion' });
    }

    const newCourse = new Course({ _id, nombre, descripcion });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    console.error('Error adding course:', err);
    res.status(500).json({ error: 'Error al agregar curso' });
  }
});

// Delete a course by ID (Admin/Moderator only)
router.delete('/:id', authenticateToken, checkAdminOrModerator, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.status(200).json({ message: 'Curso eliminado exitosamente' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ error: 'Error al eliminar curso' });
  }
});

module.exports = router;
