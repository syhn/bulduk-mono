import os
from django.core.wsgi import get_wsgi_application

# settings.py dosyasının konumunu belirtir
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')

# WSGI uygulamasını oluşturur
application = get_wsgi_application() 