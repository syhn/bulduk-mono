from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings
from django.contrib.auth.models import User

# Sabit kullanıcı bilgileri
VALID_CREDENTIALS = {
    'bulduk_game_user_syhn': 'B3Y#kL9$mP2@vN5xsyhn'  # Karmaşık ve tahmin edilmesi zor
}

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if username in VALID_CREDENTIALS and VALID_CREDENTIALS[username] == password:
        # Kullanıcı yoksa oluştur
        user, _ = User.objects.get_or_create(username=username)
        
        # Token oluştur (1 gün geçerli)
        token = AccessToken.for_user(user)
        
        return Response({
            'token': str(token)
        })
    
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
