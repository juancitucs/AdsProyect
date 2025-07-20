
// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id: String,  // aquí guardas studentCode
  nombre: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },  // renombrado desde 'contrasena'
  tipo: String,
  perfil: {
    bio: String,
    foto: String,
    intereses: [String]
  },
  favoritos: { type: [String], default: [] }
});

module.exports = mongoose.model('User', UserSchema);

