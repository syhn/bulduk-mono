from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ipware import get_client_ip
from api.core.mongodb import get_questions_collection, get_sessions_collection
from ..enums import AnswerStatus
from datetime import datetime

@swagger_auto_schema(
    method='post',
    operation_description="Check if the answer is correct",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['unique_id', 'answer', 'session_id'],
        properties={
            'unique_id': openapi.Schema(type=openapi.TYPE_STRING, description='Question Unique ID'),
            'answer': openapi.Schema(
                type=openapi.TYPE_STRING, 
                description='Answer status',
                enum=['true', 'false', 'skipped', 'not_answered']
            ),
            'session_id': openapi.Schema(type=openapi.TYPE_STRING, description='Session ID'),
        }
    ),
    responses={
        200: openapi.Response(
            description="Returns whether the answer is correct and detailed session stats",
            examples={
                "application/json": {
                    "correct": True,
                    "session_stats": {
                        "total_questions": 8,
                        "details": {
                            "correct_answers": 2,
                            "wrong_answers": 4,
                            "skipped": 1,
                            "not_answered": 1
                        },
                        "accuracy": 33.33
                    }
                }
            }
        )
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_answer(request):
    try:
        unique_id = request.data.get('unique_id')
        user_answer = request.data.get('answer')
        session_id = request.data.get('session_id')
        client_ip, _ = get_client_ip(request)
        
        if not all([unique_id, user_answer is not None, session_id]):
            return Response(
                {"error": "unique_id, answer and session_id are required"}, 
                status=400
            )

        # Answer status kontrolü
        if not AnswerStatus.is_valid(user_answer):
            return Response(
                {"error": f"answer must be one of: {[status.value for status in AnswerStatus]}"}, 
                status=400
            )

        # Session kontrolü
        sessions_collection = get_sessions_collection()
        session = sessions_collection.find_one({
            'session_id': session_id,
            'completed': False
        })
        
        if not session:
            return Response({"error": "Invalid or expired session"}, status=400)
            
        # IP kontrolü
        if session['ip_address'] != client_ip:
            return Response({"error": "IP address mismatch"}, status=400)

        # MongoDB'den soruyu bul
        question = get_questions_collection().find_one({'unique_id': unique_id})
        if not question:
            return Response({"error": "Question not found"}, status=400)

        # Cevabı kontrol et
        is_correct = False
        if user_answer in [AnswerStatus.TRUE.value, AnswerStatus.FALSE.value]:
            user_bool = AnswerStatus.to_bool(user_answer)
            is_correct = user_bool == question['correct_answer']

        # Session'a cevabı ekle
        answer_data = {
            'question_id': unique_id,
            'user_answer': user_answer,
            'correct': is_correct,
            'answered_at': datetime.utcnow()
        }
        
        sessions_collection.update_one(
            {'session_id': session_id},
            {'$push': {'answers': answer_data}}
        )

        # Güncel session'ı al
        updated_session = sessions_collection.find_one({'session_id': session_id})
        
        # İstatistikleri hesapla
        answer_stats = {
            'correct_answers': sum(1 for answer in updated_session['answers'] 
                                 if answer['user_answer'] in [AnswerStatus.TRUE.value, AnswerStatus.FALSE.value] 
                                 and answer['correct']),
            'wrong_answers': sum(1 for answer in updated_session['answers'] 
                               if answer['user_answer'] in [AnswerStatus.TRUE.value, AnswerStatus.FALSE.value] 
                               and not answer['correct']),
            'skipped': sum(1 for answer in updated_session['answers'] 
                          if answer['user_answer'] == AnswerStatus.SKIPPED.value),
            'not_answered': sum(1 for answer in updated_session['answers'] 
                              if answer['user_answer'] == AnswerStatus.NOT_ANSWERED.value)
        }

        total_questions = len(updated_session['answers'])
        answered_questions = answer_stats['correct_answers'] + answer_stats['wrong_answers']
        accuracy = (answer_stats['correct_answers'] / answered_questions * 100) if answered_questions > 0 else 0

        return Response({
            "correct": is_correct,
            "session_stats": {
                "total_questions": total_questions,
                "details": answer_stats,
                "accuracy": round(accuracy, 2)
            }
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=400) 