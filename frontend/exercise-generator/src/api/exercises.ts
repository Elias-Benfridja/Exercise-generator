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
  const response = await apiClient.post<GenerateExerciseResponse>("/generate/", {
    topic,
    difficulty,
  });
  return response.data;
}

export async function uploadExercises(
  exercises: string[]
): Promise<UploadExercisesResponse> {
  const response = await apiClient.post<UploadExercisesResponse>("/upload/", {
    exercises,
  });
  return response.data;
}

export async function verifyExercise(exerciseId: number): Promise<VerifyResult> {
  const response = await apiClient.post<VerifyResult>(`/verify/${exerciseId}/`);
  return response.data;
}