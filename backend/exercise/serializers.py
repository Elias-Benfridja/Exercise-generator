from rest_framework import serializers
from .models import Exercise, Note, Pin

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'answer_text', 'source', 'topic', 'difficulty', 'question_text', 'is_favorited', 'is_pinned', 'my_note', 'hints']
    
    is_favorited = serializers.SerializerMethodField()
    my_note = serializers.SerializerMethodField()
    is_pinned = serializers.SerializerMethodField()

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(id=request.user.id).exists()
        return False
    
    def get_my_note(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            note = Note.objects.filter(user=request.user, exercise=obj).first()
            return note.text if note else ""
        return ""
        
    def get_is_pinned(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Pin.objects.filter(user=request.user, exercise=obj).exists()
        return False
        
        
class ExercisePostSerializer(serializers.Serializer):
    topic = serializers.CharField()
    difficulty = serializers.ChoiceField(choices=["easy", "medium", "hard"])
    
class ExerciseUploadSerializer(serializers.Serializer):
    exercises = serializers.ListField(child=serializers.CharField())
    
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'exercise', 'text']
        read_only_fields = ['exercise']
        
class PinSerializer(serializers.Serializer):
    days = serializers.IntegerField(min_value=1)