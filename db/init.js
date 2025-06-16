
db = db.getSiblingDB('TEST'); // nombre de la BD

db.users.drop(); // Limpia la colección si existe
db.users.insertMany([
  {
    "_id": "20240001",
    "nombre": "Ana",
    "email": "ana@mail.com",
    "contrasena": "123",
    "tipo": "estudiante",
    "perfil": { "bio": "", "foto": "", "intereses": [] }
  },
  {
    "_id": "20240002",
    "nombre": "Luis",
    "email": "luis@mail.com",
    "contrasena": "456",
    "tipo": "estudiante",
    "perfil": { "bio": "", "foto": "", "intereses": [] }
  }
]);
