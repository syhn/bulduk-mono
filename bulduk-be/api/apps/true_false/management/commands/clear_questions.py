from django.core.management.base import BaseCommand
from api.core.mongodb import get_questions_collection

class Command(BaseCommand):
    help = 'Clear all questions from MongoDB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force delete without confirmation',
        )

    def handle(self, *args, **kwargs):
        try:
            questions_collection = get_questions_collection()
            total_questions = questions_collection.count_documents({})
            
            if total_questions == 0:
                self.stdout.write(
                    self.style.SUCCESS('No questions found to delete.')
                )
                return
                
            if not kwargs['force']:
                confirm = input(f'\nYou are about to delete {total_questions} questions. Are you sure? [y/N]: ')
                if confirm.lower() != 'y':
                    self.stdout.write(
                        self.style.WARNING('Operation cancelled.')
                    )
                    return
            
            # Tüm soruları sil
            result = questions_collection.delete_many({})
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {result.deleted_count} questions')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error clearing questions: {str(e)}')
            ) 