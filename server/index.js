import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Endpoint temporal para debug: lista archivos en /dist/assets
app.get('/debug-assets', (req, res) => {
  const assetsPath = path.join(__dirname, '../dist/assets');
  fs.readdir(assetsPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ files });
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del directorio 'dist'
app.use(express.static(path.join(__dirname, "../dist")));

// Endpoint para búsqueda de imágenes
app.get("/api/search-images", async (req, res) => {
  const { query } = req.query;
  const apiKey = process.env.VITE_UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Unsplash API key is missing" });
  }

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&client_id=${apiKey}&per_page=9`
    );

    if (!response.ok) {
      throw new Error(
        `Unsplash API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const imageUrls = data.results.map((result) => result.urls.regular);
    res.json(imageUrls);
  } catch (error) {
    console.error("Error searching Unsplash:", error);
    res.status(500).json({ error: "Failed to search images" });
  }
});

// Fallback para SPA (React/Vite)
app.get('*', (req, res, next) => {
  // Si la ruta tiene punto (.), probablemente es un asset estático: pasa al siguiente middleware (404 si no existe)
  if (req.path.includes('.')) {
    return next();
  }
  // Si no, sirve el index.html (SPA)
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {

});
