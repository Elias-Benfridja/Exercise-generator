from rest_framework import serializers
from .models import Exercise

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'answer_text', 'source', 'topic', 'difficulty', 'question_text']
        
class ExercisePostSerializer(serializers.Serializer):
    topic = serializers.CharField()
    difficulty = serializers.ChoiceField(choices=["easy", "medium", "hard"])
    
class ExerciseUploadSerializer(serializers.Serializer):
    exercises = serializers.ListField(child=serializers.CharField())