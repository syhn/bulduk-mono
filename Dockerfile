# Build stage
FROM node:18-slim
WORKDIR /app

# Copy frontend files
COPY bulduk/package*.json ./
RUN npm install
COPY bulduk ./

# Build frontend
RUN npm run build

# Serve frontend with simple Express server
RUN npm install express
RUN echo 'const express = require("express");\n\
const path = require("path");\n\
const app = express();\n\
\n\
app.use(express.static(path.join(__dirname, "build")));\n\
\n\
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