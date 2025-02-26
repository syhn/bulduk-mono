import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM için __dirname alternatifi
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Frontend build klasörünü statik olarak serve et
app.use(express.static(path.join(__dirname, '../public')));

// Tüm route'ları frontend uygulamasına yönlendir (SPA için)
app.get('*', (req: Request, res: Response) => {
  // API route'ları hariç tüm istekleri index.html'e yönlendir
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
}); 