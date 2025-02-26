const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

// Debug için API isteklerini loglayalım
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`API İsteği: ${req.method} ${req.url}`);
  }
  next();
});

// API isteklerini doğru backend'e yönlendir
app.use('/api', createProxyMiddleware({
  target: process.env.API_URL || "http://backend:8000", // Docker Compose'daki backend service'ine
  changeOrigin: true,
  secure: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxy istek: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Proxy yanıt: ${proxyRes.statusCode} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`Proxy hatası: ${err.message}`);
    res.status(500).json({ 
      error: "Proxy hatası", 
      message: err.message 
    });
  }
}));

// Static dosyaları serve et
app.use(express.static(path.join(__dirname, "build")));

// Diğer tüm istekleri React'e yönlendir
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API proxy hedefi: ${process.env.API_URL || "http://backend:8000"}`);
}); 