
db = db.getSiblingDB("TEST");

db.usuarios.insertMany(require('/docker-entrypoint-initdb.d/Work-Codile.usuarios.json'));
db.trabajos.insertMany(require('/docker-entrypoint-initdb.d/Work-Codile.trabajos.json'));
db.cursos.insertMany(require('/docker-entrypoint-initdb.d/Work-Codile.cursos.json'));
db.notificaciones.insertMany(require('/docker-entrypoint-initdb.d/Work-Codile.notificaciones.json'));
db.reportes.insertMany(require('/docker-entrypoint-initdb.d/Work-Codile.reportes.json'));

