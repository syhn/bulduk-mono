# Python image'ı kullan
FROM python:3.13-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Sistem bağımlılıklarını yükle
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt dosyasını kopyala
COPY requirements.txt .

# Python bağımlılıklarını yükle
RUN pip install --no-cache-dir -r requirements.txt

# Proje dosyalarını kopyala
COPY . .

# Port ayarı - Cloud Run için 8080
ENV PORT 8080

# Migration'ları çalıştır ve sunucuyu başlat
CMD python manage.py migrate && python manage.py runserver 0.0.0.0:$PORT 