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

// API isteklerini belirtilen hedeflere yönlendir
const targetUrl = process.env.API_URL ? process.env.API_URL : "http://backend:8000";
console.log(`Proxy hedef URL'si: ${targetUrl}`);

app.use('/api', createProxyMiddleware({
  target: targetUrl,
  changeOrigin: true,
  secure: false, // Self-signed sertifikalar için
  logLevel: 'debug',
  pathRewrite: {
    '^/api': '/api' // Path'i koru
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxy istek: ${req.method} ${req.url} -> ${proxyReq.path}`);
    
    // Content-Type header'ını ayarla (gerekirse)
    if (!proxyReq.getHeader('Content-Type') && req.body) {
      proxyReq.setHeader('Content-Type', 'application/json');
    }
    
    // Body'yi string olarak ayarla (gerekirse)
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Proxy yanıt: ${proxyRes.statusCode} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`Proxy hatası: ${err.message}`);
    console.error(`Hata detayları: ${JSON.stringify(err)}`);
    
    // İstemciye anlamlı hata mesajı gönder
    res.status(500).json({ 
      error: "API sunucusuna bağlanılamadı",
      message: err.message,
      details: "Lütfen backend servisinin çalıştığından emin olun"
    });
  }
}));

// JSON body parser ekleyelim
app.use(express.json());

// Static dosyaları serve et
app.use(express.static(path.join(__dirname, "build")));

// Diğer tüm istekleri React'e yönlendir
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API proxy hedefi: ${targetUrl}`);
}); 