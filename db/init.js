
db = db.getSiblingDB("TEST");

const usuariosData = require('/docker-entrypoint-initdb.d/Work-Codile.usuarios.json');
console.log('Attempting to insert users:', JSON.stringify(usuariosData, null, 2));
db.usuarios.insertMany(usuariosData);

db.trabajos.insertMany(require('/docker-entrypoint-initdb-d/Work-Codile.trabajos.json'));
db.cursos.insertMany(require('/docker-entrypoint-initdb-d/Work-Codile.cursos.json'));
db.notificaciones.insertMany(require('/docker-entrypoint-initdb-d/Work-Codile.notificaciones.json'));
db.reportes.insertMany(require('/docker-entrypoint-initdb-d/Work-Codile.reportes.json'));

