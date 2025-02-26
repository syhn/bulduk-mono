from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from api.core.mongodb import get_sessions_collection
from ..enums import AnswerStatus

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
            description="Returns session statistics",
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
    try:
        session_id = request.query_params.get('session_id')
        if not session_id:
            return Response({"error": "session_id is required"}, status=400)
        
        session = get_sessions_collection().find_one({'session_id': session_id})
        if not session:
            return Response({"error": "Session not found"}, status=400)
        
        # Detaylı istatistikler
        answer_stats = {
            'correct_answers': sum(1 for answer in session['answers'] 
                                 if answer['user_answer'] in [AnswerStatus.TRUE.value, AnswerStatus.FALSE.value] 
                                 and answer['correct']),
            'wrong_answers': sum(1 for answer in session['answers'] 
                               if answer['user_answer'] in [AnswerStatus.TRUE.value, AnswerStatus.FALSE.value] 
                               and not answer['correct']),
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
            "details": answer_stats,
            "accuracy": round(accuracy, 2),
            "started_at": session['started_at']
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=400) 