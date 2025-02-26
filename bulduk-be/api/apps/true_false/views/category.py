from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from api.core.mongodb import get_questions_collection
from ..enums import DifficultyLevel

@swagger_auto_schema(
    method='get',
    operation_description="Get all categories with subcategories, question counts and difficulty distribution",
    responses={
        200: openapi.Response(
            description="Returns categories with details",
            examples={
                "application/json": {
                    "categories": [
                        {
                            "name": "History",
                            "total_questions": 150,
                            "difficulty_distribution": {
                                "easy": 40,
                                "normal": 50,
                                "hard": 40,
                                "very_hard": 20
                            },
                            "subcategories": [
                                {
                                    "name": "World History",
                                    "total_questions": 45,
                                    "difficulty_distribution": {
                                        "easy": 10,
                                        "normal": 15,
                                        "hard": 12,
                                        "very_hard": 8
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        )
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_categories(request):
    """Get all categories with details"""
    try:
        questions_collection = get_questions_collection()
        
        pipeline = [
            {
                '$group': {
                    '_id': '$metadata.category',
                    'total_questions': {'$sum': 1},
                    'subcategories': {'$addToSet': '$metadata.subcategory'},
                    'difficulties': {
                        '$push': '$metadata.difficulty'
                    }
                }
            },
            {
                '$sort': {'_id': 1}
            }
        ]
        
        categories = list(questions_collection.aggregate(pipeline))
        result = []
        
        for category in categories:
            if not category['_id']:
                continue
            
            # Ana kategori için zorluk dağılımını hesapla
            difficulty_distribution = {
                'easy': 0,
                'normal': 0,
                'hard': 0,
                'very_hard': 0
            }
            
            for diff in category['difficulties']:
                if diff == DifficultyLevel.EASY.value:
                    difficulty_distribution['easy'] += 1
                elif diff == DifficultyLevel.NORMAL.value:
                    difficulty_distribution['normal'] += 1
                elif diff == DifficultyLevel.HARD.value:
                    difficulty_distribution['hard'] += 1
                elif diff == DifficultyLevel.VERY_HARD.value:
                    difficulty_distribution['very_hard'] += 1
            
            subcategories = []
            for subcategory in category['subcategories']:
                if not subcategory:
                    continue
                
                sub_difficulties = {
                    'easy': 0,
                    'normal': 0,
                    'hard': 0,
                    'very_hard': 0
                }
                
                sub_questions = questions_collection.find({
                    'metadata.category': category['_id'],
                    'metadata.subcategory': subcategory
                })
                
                total_sub_questions = 0
                for question in sub_questions:
                    diff = question['metadata']['difficulty']
                    if diff == DifficultyLevel.EASY.value:
                        sub_difficulties['easy'] += 1
                    elif diff == DifficultyLevel.NORMAL.value:
                        sub_difficulties['normal'] += 1
                    elif diff == DifficultyLevel.HARD.value:
                        sub_difficulties['hard'] += 1
                    elif diff == DifficultyLevel.VERY_HARD.value:
                        sub_difficulties['very_hard'] += 1
                    total_sub_questions += 1
                
                subcategories.append({
                    'name': subcategory,
                    'total_questions': total_sub_questions,
                    'difficulty_distribution': sub_difficulties
                })
            
            subcategories.sort(key=lambda x: x['name'])
            
            result.append({
                'name': category['_id'],
                'total_questions': category['total_questions'],
                'difficulty_distribution': difficulty_distribution,
                'subcategories': subcategories
            })
        
        return Response({'categories': result})
        
    except Exception as e:
        return Response({'error': str(e)}, status=500) 