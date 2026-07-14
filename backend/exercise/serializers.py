from rest_framework import serializers
from .models import Exercise

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'answer_text', 'source', 'topic', 'difficulty', 'question_text', 'is_favorited']
    
    is_favorited = serializers.SerializerMethodField()

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(id=request.user.id).exists()
        return False
        
class ExercisePostSerializer(serializers.Serializer):
    topic = serializers.CharField()
    difficulty = serializers.ChoiceField(choices=["easy", "medium", "hard"])
    
class ExerciseUploadSerializer(serializers.Serializer):
    exercises = serializers.ListField(child=serializers.CharField())