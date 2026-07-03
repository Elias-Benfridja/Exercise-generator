from django.urls import path
from .views import ExerciseView, AllExercisesView, UploadExercisesView

urlpatterns = [
    path('generate/', ExerciseView.as_view(), name = "exercise"),
    path('all/', AllExercisesView.as_view(), name = "allexercises"),
    path('upload/', UploadExercisesView.as_view(), name="upload-exercises")
]
