# Build stage
FROM node:18-slim
WORKDIR /app

# Copy frontend files
COPY bulduk/package*.json ./
RUN npm install
COPY bulduk ./

# Build frontend
RUN npm run build

# Serve frontend with Express + proxy
RUN npm install express http-proxy-middleware

# Create server.js file with heredoc syntax
RUN cat > server.js << 'EOL'
const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

// API isteklerini buld.uk backend'ine yönlendir
app.use("/api", createProxyMiddleware({
  target: process.env.API_URL || "https://buld.uk",
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'  // Path rewrite gerekirse kullanılabilir
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
});
EOL

# Expose port
EXPOSE 8080

# Start command
CMD ["node", "server.js"]