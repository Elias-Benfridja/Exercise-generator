import apiClient from "./client";
import type { Exercise } from "../types";

export interface GenerateExerciseResponse {
  exercise: Exercise;
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
): Promise<Exercise> {
  const response = await apiClient.post<GenerateExerciseResponse>("/generate/", {
    topic,
    difficulty,
  });
  return response.data.exercise;
}

export async function uploadExercises(
  exercises: string[]
): Promise<UploadExercisesResponse> {
  const response = await apiClient.post<UploadExercisesResponse>("/upload/", {
    exercises,
  });
  return response.data;
}