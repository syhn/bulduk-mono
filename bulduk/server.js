const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

// CORS ayarları
app.use(cors());

// Static dosyaları serve et
app.use(express.static(path.join(__dirname, 'build')));

// Tüm route'ları index.html'e yönlendir (React Router için)
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 