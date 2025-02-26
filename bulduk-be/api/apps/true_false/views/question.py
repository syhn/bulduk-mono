from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from api.core.mongodb import get_questions_collection, get_sessions_collection
from ..enums import DifficultyLevel

@swagger_auto_schema(
    method='get',
    operation_description="Get a random true/false question",
    manual_parameters=[
        openapi.Parameter(
            'session_id',
            openapi.IN_QUERY,
            description="Session ID",
            type=openapi.TYPE_STRING,
            required=True
        )
    ],
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
            
        session = get_sessions_collection().find_one({
            'session_id': session_id,
            'completed': False
        })
        
        if not session:
            return Response({"error": "Invalid or expired session"}, status=400)
        
        # Pipeline oluştur
        pipeline = []
        
        # Zorluk seviyesi filtresi - integer olarak karşılaştır
        if session.get('difficulty') is not None:
            pipeline.append(
                {'$match': {'metadata.difficulty': session['difficulty']}}
            )
        
        if session.get('category') is not None:
            pipeline.append(
                {'$match': {'metadata.category': session['category']}}
            )
        
        # Cevaplanmış soruları filtrele
        answered_questions = [a['question_id'] for a in session.get('answers', [])]
        if answered_questions:
            pipeline.append(
                {'$match': {'unique_id': {'$nin': answered_questions}}}
            )
        
        # Random soru seçimi ve projeksiyon
        pipeline.extend([
            {'$sample': {'size': 1}},
            {'$project': {
                '_id': 0,
                'unique_id': 1,
                'question_text': 1,
                'metadata': 1
            }}
        ])
        
        # Debug bilgisi
        print(f"Session difficulty: {session.get('difficulty')}")
        
        # Toplam soru sayısını kontrol et - integer olarak karşılaştır
        total_questions = get_questions_collection().count_documents({
            'metadata.difficulty': session.get('difficulty')
        })
        print(f"Total available questions: {total_questions}")
        
        # Soruyu getir
        questions = list(get_questions_collection().aggregate(pipeline))
        if not questions:
            return Response({
                "error": "No more questions available",
                "debug": {
                    "total_questions": total_questions,
                    "difficulty": DifficultyLevel.to_text(session.get('difficulty')),
                    "answered_count": len(answered_questions)
                }
            }, status=404)
            
        return Response(questions[0])
        
    except Exception as e:
        print(f"Error: {str(e)}")  # Debug için
        return Response({'error': str(e)}, status=500) 