import apiClient from "./client";
import type { Exercise, VerifyResult } from "../types";


export interface GenerateExerciseResponse {
  exercise: Exercise;
  predicted_difficulty: "easy" | "medium" | "hard" | null;
}

export interface UploadExercisesResponse {
  tagged_exercises: Exercise[];
  trending_lesson: string;
  trending_difficulty: "easy" | "medium" | "hard";
  suggested_exercise: Exercise;
}

export async function generateExercise(
  topic: string,
  difficulty: "easy" | "medium" | "hard"
): Promise<GenerateExerciseResponse> {
  const response = await apiClient.post<GenerateExerciseResponse>("/exercise/generate/", {
    topic,
    difficulty,
  });
  return response.data;
}

export async function uploadExercises(
  exercises: string[]
): Promise<UploadExercisesResponse> {
  const response = await apiClient.post<UploadExercisesResponse>("/exercise/upload/", {
    exercises,
  });
  return response.data;
}

export async function verifyExercise(exerciseId: number): Promise<VerifyResult> {
  const response = await apiClient.post<VerifyResult>(`/exercise/verify/${exerciseId}/`);
  return response.data;
}

export async function uploadExerciseFile(
  file: File
): Promise<UploadExercisesResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<UploadExercisesResponse>(
    "/exercise/upload-file/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function toggleFavorite(
  exerciseId: number
): Promise<{ favorited: boolean }> {
  const response = await apiClient.post<{ favorited: boolean }>(
    `/exercise/favorite/${exerciseId}/`
  );
  return response.data;
}

export async function getMyFavorites(): Promise<Exercise[]> {
  const response = await apiClient.get<Exercise[]>("/exercise/favorite/");
  return response.data;
}

export async function getMyHistory(): Promise<Exercise[]> {
  const response = await apiClient.get<Exercise[]>("/exercise/mine/");
  return response.data;
}