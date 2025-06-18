
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: String, // studentCode como clave
  nombre: String,
  email: String,
  contrasena: String,
  tipo: String,
  perfil: {
    bio: String,
    foto: String,
    intereses: [String]
  }
}, {
  collection: 'Work-Codile.usuarios'
});

module.exports = mongoose.model('User', userSchema);
