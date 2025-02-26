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
RUN echo 'const express = require("express");\n\
const path = require("path");\n\
const { createProxyMiddleware } = require("http-proxy-middleware");\n\
const app = express();\n\
\n\
// API isteklerini backend\'e yönlendir\n\
app.use("/api", createProxyMiddleware({\n\
  target: process.env.API_URL || "http://localhost:8000",\n\
  changeOrigin: true\n\
}));\n\
\n\
// Static dosyaları serve et\n\
app.use(express.static(path.join(__dirname, "build")));\n\
\n\
// Diğer tüm istekleri React\'e yönlendir\n\
app.get("*", (req, res) => {\n\
  res.sendFile(path.join(__dirname, "build", "index.html"));\n\
});\n\
\n\
const PORT = process.env.PORT || 8080;\n\
app.listen(PORT, () => {\n\
  console.log(`Server running on port ${PORT}`);\n\
});' > server.js

# Expose port
EXPOSE 8080

# Start command
CMD ["node", "server.js"] 