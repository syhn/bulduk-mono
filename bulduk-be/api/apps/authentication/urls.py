from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    path('auth/login/', views.login, name='login'),
] 