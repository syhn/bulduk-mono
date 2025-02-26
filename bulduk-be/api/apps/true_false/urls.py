from django.urls import path
from .views import start_session, get_question, check_answer, get_session_stats, get_categories, end_session

app_name = 'true_false'

urlpatterns = [
    path('games/true-false/session/start/', start_session, name='start_session'),
    path('games/true-false/session/end/', end_session, name='end_session'),
    path('games/true-false/question/', get_question, name='get_question'),
    path('games/true-false/check/', check_answer, name='check_answer'),
    path('games/true-false/stats/', get_session_stats, name='get_session_stats'),
    path('games/true-false/categories/', get_categories, name='get_categories'),
] 