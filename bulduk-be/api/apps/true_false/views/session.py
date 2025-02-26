from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from datetime import datetime
import uuid
from ipware import get_client_ip
from api.core.mongodb import get_sessions_collection

@swagger_auto_schema(
    method='post',
    operation_description="Start a new game session",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'difficulty': openapi.Schema(
                type=openapi.TYPE_INTEGER,
                description='Difficulty level (0: Easy, 1: Normal, 2: Hard, 3: Very Hard)',
                enum=[0, 1, 2, 3],
                default=1
            ),
            'category': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='Category',
                default=None
            ),
            'subcategory': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='Subcategory',
                default=None
            )
        }
    ),
    responses={
        200: openapi.Response(
            description="Returns session information",
            examples={
                "application/json": {
                    "session_id": "uuid4-string",
                    "started_at": "datetime",
                    "difficulty": 1,
                    "category": None,
                    "subcategory": None
                }
            }
        )
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_session(request):
    """Yeni bir session başlat"""
    try:
        client_ip, _ = get_client_ip(request)
        difficulty = request.data.get('difficulty')
        category = request.data.get('category')
        subcategory = request.data.get('subcategory')
        new_session = {
            'session_id': str(uuid.uuid4()),
            'ip_address': client_ip,
            'started_at': datetime.utcnow(),
            'answers': [],
            'completed': False,
            'difficulty': difficulty,
            'category': category,
            'subcategory': subcategory
        }
        
        sessions_collection = get_sessions_collection()
        sessions_collection.insert_one(new_session)
        
        return Response({
            'session_id': new_session['session_id'],
            'started_at': new_session['started_at'],
            'difficulty': difficulty,
            'category': category,
            'subcategory': subcategory
        })
        
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@swagger_auto_schema(
    method='post',
    operation_description="End a game session",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'session_id': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='Session ID'
            )
        },
        required=['session_id']
    ),
    responses={
        200: openapi.Response(
            description="Session ended successfully",
            examples={
                "application/json": {
                    "message": "Session ended successfully",
                    "stats": {
                        "total_questions": 10,
                        "correct_answers": 7,
                        "wrong_answers": 2,
                        "skipped": 1,
                        "accuracy": 77.78,
                        "duration": "00:15:30"
                    }
                }
            }
        ),
        400: openapi.Response(description="Invalid session ID or already completed")
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_session(request):
    """Session'ı sonlandır ve istatistikleri döndür"""
    try:
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({"error": "session_id is required"}, status=400)

        sessions_collection = get_sessions_collection()
        session = sessions_collection.find_one({
            'session_id': session_id,
            'completed': False
        })

        if not session:
            return Response({"error": "Invalid or already completed session"}, status=400)

        # Session'ı sonlandır
        end_time = datetime.utcnow()
        duration = end_time - session['started_at']

        # İstatistikleri hesapla
        answer_stats = {
            'correct_answers': sum(1 for answer in session['answers'] 
                                 if answer['user_answer'] in ['true', 'false'] 
                                 and answer['correct']),
            'wrong_answers': sum(1 for answer in session['answers'] 
                               if answer['user_answer'] in ['true', 'false'] 
                               and not answer['correct']),
            'skipped': sum(1 for answer in session['answers'] 
                          if answer['user_answer'] == 'skipped'),
            'not_answered': sum(1 for answer in session['answers'] 
                              if answer['user_answer'] == 'not_answered')
        }

        total_questions = len(session['answers'])
        answered_questions = answer_stats['correct_answers'] + answer_stats['wrong_answers']
        accuracy = (answer_stats['correct_answers'] / answered_questions * 100) if answered_questions > 0 else 0

        # Session'ı güncelle
        sessions_collection.update_one(
            {'session_id': session_id},
            {
                '$set': {
                    'completed': True,
                    'completed_at': end_time,
                    'duration': str(duration),
                    'stats': {
                        'total_questions': total_questions,
                        'correct_answers': answer_stats['correct_answers'],
                        'wrong_answers': answer_stats['wrong_answers'],
                        'skipped': answer_stats['skipped'],
                        'not_answered': answer_stats['not_answered'],
                        'accuracy': round(accuracy, 2)
                    }
                }
            }
        )

        return Response({
            "message": "Session ended successfully",
            "stats": {
                "total_questions": total_questions,
                "correct_answers": answer_stats['correct_answers'],
                "wrong_answers": answer_stats['wrong_answers'],
                "skipped": answer_stats['skipped'],
                "not_answered": answer_stats['not_answered'],
                "accuracy": round(accuracy, 2),
                "duration": str(duration)
            }
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500) 