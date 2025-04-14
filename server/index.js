import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint para búsqueda de imágenes
app.get('/api/search-images', async (req, res) => {
  const { query } = req.query;
  const apiKey = process.env.VITE_UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Unsplash API key is missing' });
  }

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${apiKey}&per_page=9`
    );
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const imageUrls = data.results.map(result => result.urls.regular);
    res.json(imageUrls);
  } catch (error) {
    console.error('Error searching Unsplash:', error);
    res.status(500).json({ error: 'Failed to search images' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});