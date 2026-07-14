from django.urls import path
from .views import ExerciseView, AllExercisesView, UploadExercisesView, VerifyExerciseView, UploadFileView, FavoriteToggleView, MyHistoryView, MyFavoritesView

urlpatterns = [
    path('generate/', ExerciseView.as_view(), name = "exercise"),
    path('all/', AllExercisesView.as_view(), name = "allexercises"),
    path('upload/', UploadExercisesView.as_view(), name="upload-exercises"),
    path('verify/<int:exercise_id>/', VerifyExerciseView.as_view(), name="verify-exercise"),
    path('upload-file/', UploadFileView.as_view(), name="upload-file"),
    path('favorite/<int:exercise_id>/', FavoriteToggleView.as_view(), name = "toggle-favorite"),
    path('favorite/', MyFavoritesView.as_view(), name="favotires"),
    path('mine/', MyHistoryView.as_view(), name="my-exercises")
]
