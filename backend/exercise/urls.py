from django.urls import path
from .views import ExerciseView, AllExercisesView, UploadExercisesView, VerifyExerciseView, UploadFileView

urlpatterns = [
    path('generate/', ExerciseView.as_view(), name = "exercise"),
    path('all/', AllExercisesView.as_view(), name = "allexercises"),
    path('upload/', UploadExercisesView.as_view(), name="upload-exercises"),
    path('verify/<int:exercise_id>/', VerifyExerciseView.as_view(), name="verify-exercise"),
    path('upload-file/', UploadFileView.as_view(), name="upload-file")
]
