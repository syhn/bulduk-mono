# Build stage
FROM node:18-slim
WORKDIR /app

# Add curl for testing
RUN apt-get update && apt-get install -y curl && apt-get clean

# Copy frontend files
COPY bulduk/package*.json ./
RUN npm install
COPY bulduk ./

# Build frontend
RUN npm run build

# Serve frontend with Express + proxy
RUN npm install express http-proxy-middleware

# Önce server.js dosyasını COPY komutu ile kopyalayalım
COPY server.js .

# Expose port
EXPOSE 8080

# Start command
CMD ["node", "server.js"]