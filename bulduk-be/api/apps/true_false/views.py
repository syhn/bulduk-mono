from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.permissions import IsAuthenticated
from api.core.mongodb import get_questions_collection, get_sessions_collection
import random
from datetime import datetime
import uuid
from ipware import get_client_ip
from .enums import AnswerStatus

@swagger_auto_schema(
    method='get',
    operation_description="Get a random true/false question",
    responses={200: openapi.Response(description="Returns a random question")}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_question(request):
    """Random question endpoint"""
    try:
        session_id = request.query_params.get('session_id')
        if not session_id:
            return Response({"error": "session_id is required"}, status=400)
            
        # Session'ı kontrol et
        sessions_collection = get_sessions_collection()
        session = sessions_collection.find_one({
            'session_id': session_id,
            'completed': False
        })
        
        if not session:
            return Response({"error": "Invalid or expired session"}, status=400)
        
        # Rastgele bir soru seç
        pipeline = []
        
        # Eğer session'da difficulty varsa filtrele, yoksa tüm zorluk seviyelerinden getir
        if session.get('difficulty') is not None:
            pipeline.append(
                {'$match': {'metadata.difficulty': session['difficulty']}}
            )
        
        pipeline.extend([
            {'$sample': {'size': 1}},  # Rastgele 1 soru seç
            {'$project': {             # Sadece istenen alanları getir
                '_id': 0,
                'unique_id': 1,
                'question_text': 1,
                'metadata': 1
            }}
        ])
        
        question = list(get_questions_collection().aggregate(pipeline))[0]
        return Response(question)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

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
    """Answer check endpoint"""
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
            return Response(
                {"error": "Invalid or expired session"}, 
                status=400
            )
            
        # IP kontrolü
        if session['ip_address'] != client_ip:
            return Response(
                {"error": "IP address mismatch"}, 
                status=400
            )

        # MongoDB'den soruyu bul
        question = get_questions_collection().find_one({'unique_id': unique_id})
        
        if not question:
            return Response(
                {"error": "Question not found"}, 
                status=404
            )

        # Cevap kontrolü
        answer_bool = AnswerStatus.to_bool(user_answer)
        is_correct = False
        if answer_bool is not None:  # true veya false ise
            is_correct = question['correct_answer'] == answer_bool
        
        # Cevabı kaydet
        sessions_collection.update_one(
            {'_id': session['_id']},
            {
                '$push': {
                    'answers': {
                        'question_id': unique_id,  # unique_id kullan
                        'user_answer': user_answer,
                        'correct': is_correct,
                        'answered_at': datetime.utcnow()
                    }
                }
            }
        )
        
        # Session istatistiklerini hesapla
        updated_session = sessions_collection.find_one({'_id': session['_id']})
        total_questions = len(updated_session['answers'])
        
        # Detaylı istatistikler
        answer_stats = {
            'correct_answers': sum(1 for answer in updated_session['answers'] 
                                 if answer['user_answer'] == AnswerStatus.TRUE.value and answer['correct'] or 
                                    answer['user_answer'] == AnswerStatus.FALSE.value and answer['correct']),
            'wrong_answers': sum(1 for answer in updated_session['answers'] 
                               if (answer['user_answer'] == AnswerStatus.TRUE.value or 
                                   answer['user_answer'] == AnswerStatus.FALSE.value) and not answer['correct']),
            'skipped': sum(1 for answer in updated_session['answers'] 
                          if answer['user_answer'] == AnswerStatus.SKIPPED.value),
            'not_answered': sum(1 for answer in updated_session['answers'] 
                              if answer['user_answer'] == AnswerStatus.NOT_ANSWERED.value)
        }
        
        # Sadece cevaplanan sorular için doğruluk oranı
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
        return Response({'error': str(e)}, status=400)

# Session istatistikleri endpoint'i
@swagger_auto_schema(
    method='get',
    operation_description="Get session statistics",
    manual_parameters=[
        openapi.Parameter(
            'session_id',
            openapi.IN_QUERY,
            description="Session ID",
            type=openapi.TYPE_STRING,
            required=True
        )
    ],
    responses={
        200: openapi.Response(
            description="Returns detailed session statistics",
            examples={
                "application/json": {
                    "total_score": 2,
                    "total_questions": 8,
                    "details": {
                        "correct_answers": 2,
                        "wrong_answers": 4,
                        "skipped": 1,
                        "not_answered": 1
                    },
                    "accuracy": 33.33,
                    "started_at": "2024-02-05T12:00:00Z"
                }
            }
        )
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_stats(request):
    """Get session statistics"""
    try:
        session_id = request.query_params.get('session_id')
        if not session_id:
            return Response({"error": "session_id is required"}, status=400)
            
        sessions_collection = get_sessions_collection()
        session = sessions_collection.find_one({
            'session_id': session_id
        })
        
        if not session:
            return Response({
                "total_score": 0,
                "total_questions": 0,
                "details": {
                    "correct_answers": 0,
                    "wrong_answers": 0,
                    "skipped": 0,
                    "not_answered": 0
                },
                "accuracy": 0,
                "started_at": None
            })
        
        # Detaylı istatistikler
        answer_stats = {
            'correct_answers': sum(1 for answer in session['answers'] 
                                 if answer['user_answer'] == AnswerStatus.TRUE.value and answer['correct'] or 
                                    answer['user_answer'] == AnswerStatus.FALSE.value and answer['correct']),
            'wrong_answers': sum(1 for answer in session['answers'] 
                               if (answer['user_answer'] == AnswerStatus.TRUE.value or 
                                   answer['user_answer'] == AnswerStatus.FALSE.value) and not answer['correct']),
            'skipped': sum(1 for answer in session['answers'] 
                          if answer['user_answer'] == AnswerStatus.SKIPPED.value),
            'not_answered': sum(1 for answer in session['answers'] 
                              if answer['user_answer'] == AnswerStatus.NOT_ANSWERED.value)
        }
        
        total_questions = len(session['answers'])
        answered_questions = answer_stats['correct_answers'] + answer_stats['wrong_answers']
        accuracy = (answer_stats['correct_answers'] / answered_questions * 100) if answered_questions > 0 else 0
        
        # Her doğru cevap 1 puan
        total_score = answer_stats['correct_answers']
        
        return Response({
            "total_score": total_score,
            "total_questions": total_questions,
            "details": {
                "correct_answers": answer_stats['correct_answers'],
                "wrong_answers": answer_stats['wrong_answers'],
                "skipped": answer_stats['skipped'],
                "not_answered": answer_stats['not_answered']
            },
            "accuracy": round(accuracy, 2),
            "started_at": session['started_at']
        })
        
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=400
        )

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
        }
    ),
    responses={
        200: openapi.Response(
            description="Returns session information",
            examples={
                "application/json": {
                    "session_id": "uuid4-string",
                    "started_at": "datetime",
                    "difficulty": 1
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
        difficulty = request.data.get('difficulty')  # Default: Normal
        
        # Yeni session oluştur
        new_session = {
            'session_id': str(uuid.uuid4()),
            'ip_address': client_ip,
            'started_at': datetime.utcnow(),
            'answers': [],
            'completed': False,
            'difficulty': difficulty  # Zorluk seviyesini ekle
        }
        
        sessions_collection = get_sessions_collection()
        sessions_collection.insert_one(new_session)
        
        return Response({
            'session_id': new_session['session_id'],
            'started_at': new_session['started_at'],
            'difficulty': difficulty
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500) 