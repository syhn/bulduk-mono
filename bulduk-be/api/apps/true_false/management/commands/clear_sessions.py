from django.core.management.base import BaseCommand
from api.core.mongodb import get_sessions_collection

class Command(BaseCommand):
    help = 'Clear all sessions from MongoDB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force delete without confirmation',
        )

    def handle(self, *args, **kwargs):
        try:
            sessions_collection = get_sessions_collection()
            total_sessions = sessions_collection.count_documents({})
            
            if total_sessions == 0:
                self.stdout.write(
                    self.style.SUCCESS('No sessions found to delete.')
                )
                return
                
            if not kwargs['force']:
                confirm = input(f'\nYou are about to delete {total_sessions} sessions. Are you sure? [y/N]: ')
                if confirm.lower() != 'y':
                    self.stdout.write(
                        self.style.WARNING('Operation cancelled.')
                    )
                    return
            
            # Tüm session'ları sil
            result = sessions_collection.delete_many({})
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {result.deleted_count} sessions')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error clearing sessions: {str(e)}')
            ) 