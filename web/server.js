// web/server.js
const express = require("express");
const path = require("path");
const app = express();

// Servir cualquier archivo estático en /app (tu index.html, css, js, etc)
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`🌐 Servidor estático en http://localhost:${PORT}`);
});
