from enum import Enum

class AnswerStatus(Enum):
    TRUE = "true"
    FALSE = "false"
    SKIPPED = "skipped"
    NOT_ANSWERED = "not_answered"

    @classmethod
    def is_valid(cls, value):
        return value in [item.value for item in cls]

    @classmethod
    def to_bool(cls, value):
        if value == cls.TRUE.value:
            return True
        elif value == cls.FALSE.value:
            return False
        return None

class DifficultyLevel(Enum):
    EASY = 0
    NORMAL = 1
    HARD = 2
    VERY_HARD = 3

    @classmethod
    def from_text(cls, text):
        print(text)
        text_to_enum = {
            'kolay': cls.EASY,
            'normal': cls.NORMAL,
            'zor': cls.HARD,
            'çok zor': cls.VERY_HARD,
            '"kolay"': cls.EASY,
            '"normal"': cls.NORMAL,
            '"zor"': cls.HARD,
            '"çok zor"': cls.VERY_HARD
        }
        return text_to_enum.get(text, cls.NORMAL)

    @classmethod
    def to_text(cls, value):
        enum_to_text = {
            cls.EASY: 'Kolay',
            cls.NORMAL: 'Normal',
            cls.HARD: 'Zor',
            cls.VERY_HARD: 'Çok Zor'
        }
        return enum_to_text.get(value, 'Normal') 