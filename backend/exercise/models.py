from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Exercise(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'E', 'Easy'
        MEDIUM = 'M', 'Medium'
        HARD = 'H', 'Hard'
    
        @classmethod
        def from_level(cls, level: int) -> str:
            if level <= 2:
                return cls.EASY
            elif level == 3:
                return cls.MEDIUM
            else:
                return cls.HARD
            
        @classmethod
        def from_label(cls, label: str) -> str:
            lookup = {lbl.lower(): code for code, lbl in cls.choices}
            code = lookup.get(label.lower())
            if code is None:
                raise ValueError(f"Unknown difficulty: {label}")
            return code
        
        @classmethod
        def to_label(cls, code: str) -> str:
            lookup = dict(cls.choices)  
            label = lookup.get(code)
            if label is None:
                raise ValueError(f"Unknown difficulty code: {code}")
            return label.lower()
                
                
        
    class Source(models.TextChoices):
        GENERATED = 'G', 'Generated',
        SEED_DATASET = 'S', 'Seed_dataset',
        UPLOADED = 'U', 'Uploaded'
            
    topic = models.CharField(max_length=150)
    difficulty = models.CharField(
        max_length=2,
        choices=Difficulty.choices
    )
    question_text = models.TextField()
    answer_text = models.TextField()
    source = models.CharField(
        max_length=1,
        choices=Source.choices,
        default=Source.GENERATED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    favorited_by = models.ManyToManyField(User, related_name="favorites", blank=True)