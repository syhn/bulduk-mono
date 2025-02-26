from django.core.management.base import BaseCommand
from api.core.mongodb import get_mongodb_client

class Command(BaseCommand):
    help = 'Setup MongoDB collections'

    def handle(self, *args, **kwargs):
        try:
            client = get_mongodb_client()
            db = client[client.get_database().name]
            
            # Collections oluştur
            if 'questions' not in db.list_collection_names():
                db.create_collection('questions')
                self.stdout.write(self.style.SUCCESS('Created questions collection'))
            
            if 'sessions' not in db.list_collection_names():
                db.create_collection('sessions')
                self.stdout.write(self.style.SUCCESS('Created sessions collection'))
                
            # İndexler oluştur
            db.questions.create_index('id', unique=True)
            db.sessions.create_index([('username', 1), ('completed', 1)])
            
            self.stdout.write(self.style.SUCCESS('MongoDB setup completed successfully'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}')) 