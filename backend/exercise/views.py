from .services import get_exercise, tag_and_solve_exercises, get_most_common, verify_exercise
from .serializers import ExercisePostSerializer, ExerciseSerializer, ExerciseUploadSerializer
from .models import Exercise
from rest_framework import status
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView, ListAPIView

# Create your views here.

class ExerciseView(GenericAPIView):
    serializer_class = ExercisePostSerializer
    def post(self, request):
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)
        
        topic = serializer.validated_data["topic"]
        difficulty = serializer.validated_data["difficulty"]
        try:
            exercise = get_exercise(topic, difficulty)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        exercise = ExerciseSerializer(exercise).data
        
        return Response({"exercise": exercise}, status=status.HTTP_200_OK)
    
class AllExercisesView(ListAPIView):
    serializer_class = ExerciseSerializer
    queryset = Exercise.objects.all().order_by('-created_at')
    
class UploadExercisesView(GenericAPIView):
    serializer_class = ExerciseUploadSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        exercises = serializer.validated_data["exercises"]

        try:
            saved = tag_and_solve_exercises(exercises)
            top_lesson = get_most_common(saved, "topic")
            top_difficulty_code = get_most_common(saved, "difficulty")
            top_difficulty_label = Exercise.Difficulty.to_label(top_difficulty_code)
            suggested = get_exercise(top_lesson, top_difficulty_label)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "tagged_exercises": ExerciseSerializer(saved, many=True).data,
            "trending_lesson": top_lesson,
            "trending_difficulty": top_difficulty_label,
            "suggested_exercise": ExerciseSerializer(suggested).data,
        }, status=status.HTTP_200_OK)
    
class VerifyExerciseView(GenericAPIView):
    def post(self, request, exercise_id):
        try:
            result = verify_exercise(exercise_id)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(result, status=status.HTTP_200_OK)