db = db.getSiblingDB("TEST");

// Function to safely load and insert data
function loadAndInsert(collectionName, filePath) {
    try {
        const data = require(filePath);
        console.log(`Attempting to insert into ${collectionName} from ${filePath}. Data size: ${data.length}`);
        const result = db[collectionName].insertMany(data);
        console.log(`Successfully inserted ${result.insertedIds.length} documents into ${collectionName}.`);
    } catch (e) {
        console.error(`Error inserting into ${collectionName} from ${filePath}:`, e);
    }
}

loadAndInsert("usuarios", '/docker-entrypoint-initdb.d/Work-Codile.usuarios.json');
loadAndInsert("trabajos", '/docker-entrypoint-initdb.d/Work-Codile.trabajos.json');
loadAndInsert("cursos", '/docker-entrypoint-initdb.d/Work-Codile.cursos.json');
loadAndInsert("notificaciones", '/docker-entrypoint-initdb.d/Work-Codile.notificaciones.json');
loadAndInsert("reportes", '/docker-entrypoint-initdb.d/Work-Codile.reportes.json');

// Verify counts after all insertions
console.log("Verifying document counts:");
console.log("Usuarios count:", db.usuarios.countDocuments());
console.log("Trabajos count:", db.trabajos.countDocuments());
console.log("Cursos count:", db.cursos.countDocuments());
console.log("Notificaciones count:", db.notificaciones.countDocuments());
console.log("Reportes count:", db.reportes.countDocuments());