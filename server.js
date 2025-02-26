const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

// JSON body parser'ı en başta ekleyelim
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug için API isteklerini loglayalım
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`API İsteği: ${req.method} ${req.url}`);
  }
  next();
});

// API isteklerini belirtilen hedeflere yönlendir
// Tam URL formatını kullan (https:// veya http:// ile başlayan)
const targetUrl = process.env.API_URL ? 
  (process.env.API_URL.startsWith('http') ? process.env.API_URL : `http://${process.env.API_URL}`) : 
  "http://backend:8000";

console.log(`Proxy hedef URL'si: ${targetUrl}`);

app.use('/api', createProxyMiddleware({
  target: targetUrl,
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  // pathRewrite kaldırıldı - bu sorun yaratıyor
  onProxyReq: (proxyReq, req, res) => {
    // Tam URL'yi logla
    console.log(`Proxy istek: ${req.method} ${req.url} -> ${targetUrl}${req.url}`);
    
    // Content-Type header'ını ayarla
    if (!proxyReq.getHeader('Content-Type')) {
      proxyReq.setHeader('Content-Type', 'application/json');
    }
    
    // Body'yi yeniden yazma - bu kısmı düzelttik
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
    console.error(`Hata detayları: ${err.stack}`);
    
    // İstemciye anlamlı hata mesajı gönder
    res.status(500).json({ 
      error: "API sunucusuna bağlanılamadı",
      message: err.message,
      details: `Hedef URL: ${targetUrl}${req.url}`
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
  console.log(`API proxy hedefi: ${targetUrl}`);
}); 