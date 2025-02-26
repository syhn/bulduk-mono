from pymongo import MongoClient
from django.conf import settings

def get_mongodb_client():
    connection_string = f"mongodb+srv://{settings.MONGODB_SETTINGS['username']}:{settings.MONGODB_SETTINGS['password']}@{settings.MONGODB_SETTINGS['host']}/{settings.MONGODB_SETTINGS['db_name']}?retryWrites=true&w=majority"
    client = MongoClient(connection_string)
    return client

def get_questions_collection():
    db = get_mongodb_client()[settings.MONGODB_SETTINGS['db_name']]
    return db.questions

def get_sessions_collection():
    db = get_mongodb_client()[settings.MONGODB_SETTINGS['db_name']]
    return db.sessions 