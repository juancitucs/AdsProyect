
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  _id: String, // MongoDB _id for the course
  nombre: String,
  descripcion: String,
});

module.exports = mongoose.model('Course', CourseSchema, 'cursos'); // 'cursos' is the collection name
