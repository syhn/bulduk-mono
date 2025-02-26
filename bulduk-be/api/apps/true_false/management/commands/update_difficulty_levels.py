from django.core.management.base import BaseCommand
from api.core.mongodb import get_questions_collection
from api.apps.true_false.enums import DifficultyLevel

class Command(BaseCommand):
    help = 'Update difficulty levels to numeric values'

    def handle(self, *args, **kwargs):
        try:
            questions_collection = get_questions_collection()
            
            # Tüm soruları al
            questions = questions_collection.find({})
            
            update_count = 0
            for question in questions:
                current_difficulty = question['metadata']['difficulty']
                new_difficulty = DifficultyLevel.from_text(current_difficulty).value
                
                # Güncelle
                result = questions_collection.update_one(
                    {'_id': question['_id']},
                    {'$set': {'metadata.difficulty': new_difficulty}}
                )
                
                if result.modified_count > 0:
                    update_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated {update_count} questions')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating difficulty levels: {str(e)}')
            ) 