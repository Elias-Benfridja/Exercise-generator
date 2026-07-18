from .services import get_exercise, tag_and_solve_exercises, get_most_common, verify_exercise, predict_difficulty, tag_and_solve_from_file
from .serializers import ExercisePostSerializer, ExerciseSerializer, ExerciseUploadSerializer, NoteSerializer, PinSerializer
from .models import Exercise, Note, Pin
from rest_framework import status
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

# Create your views here.


class ExerciseView(GenericAPIView):
    serializer_class = ExercisePostSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        topic = serializer.validated_data["topic"]
        difficulty = serializer.validated_data["difficulty"]
        try:
            exercise = get_exercise(topic, difficulty, user)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            predicted_difficulty = predict_difficulty(exercise.question_text)
        except Exception as e:
            predicted_difficulty = None
        exercise_data = ExerciseSerializer(exercise, context={'request': request}).data

        return Response(
            {
                "exercise": exercise_data,
                "predicted_difficulty": predicted_difficulty,
            },
            status=status.HTTP_200_OK,
        )
    
class AllExercisesView(ListAPIView):
    serializer_class = ExerciseSerializer
    queryset = Exercise.objects.all().order_by('-created_at')
    
class UploadExercisesView(GenericAPIView):
    serializer_class = ExerciseUploadSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        exercises = serializer.validated_data["exercises"]

        try:
            saved = tag_and_solve_exercises(exercises, user)
            top_lesson = get_most_common(saved, "topic")
            top_difficulty_code = get_most_common(saved, "difficulty")
            top_difficulty_label = Exercise.Difficulty.to_label(top_difficulty_code)
            suggested = get_exercise(top_lesson, top_difficulty_label, user)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "tagged_exercises": ExerciseSerializer(saved, many=True, context={'request': request}).data,
            "trending_lesson": top_lesson,
            "trending_difficulty": top_difficulty_label,
            "suggested_exercise": ExerciseSerializer(suggested, context={'request': request}).data,
        }, status=status.HTTP_200_OK)
    
class VerifyExerciseView(GenericAPIView):
    def post(self, request, exercise_id):
        try:
            result = verify_exercise(exercise_id)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(result, status=status.HTTP_200_OK)
    
class UploadFileView(GenericAPIView):
    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file_bytes = uploaded_file.read()
        mime_type = uploaded_file.content_type

        try:
            saved = tag_and_solve_from_file(file_bytes, mime_type, user)
            top_lesson = get_most_common(saved, "topic")
            top_difficulty_code = get_most_common(saved, "difficulty")
            top_difficulty_label = Exercise.Difficulty.to_label(top_difficulty_code)
            suggested = get_exercise(top_lesson, top_difficulty_label, user)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "tagged_exercises": ExerciseSerializer(saved, many=True, context={'request': request}).data,
            "trending_lesson": top_lesson,
            "trending_difficulty": top_difficulty_label,
            "suggested_exercise": ExerciseSerializer(suggested, context={'request': request}).data,
        }, status=status.HTTP_200_OK)
        
class FavoriteToggleView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, exercise_id):
        try:
            exercise = Exercise.objects.get(id=exercise_id)
        except Exercise.DoesNotExist:
            return Response({"error": f"No exercise found with id {exercise_id}"}, status=status.HTTP_404_NOT_FOUND)
            
        state = exercise.favorited_by.filter(id=request.user.id).exists()
        if state:
            exercise.favorited_by.remove(request.user)
            favorited = False
        else:
            exercise.favorited_by.add(request.user)
            favorited = True
        return Response({"favorited": favorited}, status=status.HTTP_200_OK)
    
class MyFavoritesView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExerciseSerializer
    def get_queryset(self):
        return self.request.user.favorites.all()
    
class MyHistoryView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExerciseSerializer
    def get_queryset(self):
        return Exercise.objects.filter(user=self.request.user)
    
class NoteView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NoteSerializer
    def post(self, request, exercise_id):
        try:
            exercise = Exercise.objects.get(id = exercise_id)
        except Exercise.DoesNotExist:
            return Response({"error": f"No exercise found with id {exercise_id}"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        note, created = Note.objects.update_or_create(
            user=request.user,
            exercise=exercise,
            defaults={'text': serializer.validated_data['text']}
        )
        return Response(NoteSerializer(note, context={'request': request}).data, status=status.HTTP_200_OK)
    
class PinToggleView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PinSerializer

    def post(self, request, exercise_id):
        try:
            exercise = Exercise.objects.get(id=exercise_id)
        except Exercise.DoesNotExist:
            return Response({"error": f"No exercise found with id {exercise_id}"}, status=status.HTTP_404_NOT_FOUND)

        existing = Pin.objects.filter(user=request.user, exercise=exercise).first()

        if existing:
            existing.delete()
            return Response({"pinned": False}, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        days = serializer.validated_data['days']

        review_at = timezone.now() + timedelta(days=days)
        Pin.objects.create(user=request.user, exercise=exercise, review_at=review_at, duration=days)
        return Response({"pinned": True, "review_at": review_at}, status=status.HTTP_200_OK)
    
class MyDueReviewsView(ListAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Exercise.objects.filter(
        pin__user=self.request.user,
        pin__review_at__lte=timezone.now()
    )
    