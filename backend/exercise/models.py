from django.db import models

# Create your models here.

class Exercise(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'E', 'Easy',
        MIDIUM = 'M', 'Medium',
        HARD = 'H', 'Hard'
    
    topic = models.CharField(max_length=20)
    difficulty = models.CharField(
        max_length=2,
        choices=Difficulty
    )
    question_text = models.TextField()
    answer_text = models.TextField()
    created_at = models.DateTimeField(auto_now=True)