from django.core.management.base import BaseCommand
import csv
from pathlib import Path
from api.core.mongodb import get_questions_collection
from api.apps.true_false.enums import DifficultyLevel

class Command(BaseCommand):
    help = 'Import questions from CSV file'

    def handle(self, *args, **kwargs):
        try:
            BASE_DIR = Path(__file__).resolve().parent.parent.parent
            csv_file = BASE_DIR / 'data' / 'questions.csv'
            
            questions_collection = get_questions_collection()
            
            # Mevcut koleksiyonu temizle
            questions_collection.delete_many({})
            
            with open(csv_file, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)  # CSV başlıklarını kullan
                
                for row in reader:
                    print(row)
                    question_data = {
                        'id': row['id'],  # id sütununu kullan
                        'unique_id': row['guid'],  # guid sütununu kullan
                        'question_text': row['question'].strip('"'),  # Tırnak işaretlerini kaldır
                        'correct_answer': row['cevap'].upper() == 'TRUE',
                        'explanation': row['explanation'].strip('"'),
                        'metadata': {
                            'difficulty': DifficultyLevel.from_text(row['difficulty'].lower()).value,
                            'category': row['category'],
                            'subcategory': row['subcategory']
                        }
                    }
                    print(question_data)
                    questions_collection.insert_one(question_data)
            
            # Sonuçları göster
            total_questions = questions_collection.count_documents({})
            self.stdout.write(
                self.style.SUCCESS(f'Successfully imported {total_questions} questions')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error importing questions: {str(e)}')
            ) 