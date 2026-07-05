import apiClient from "./client";
import type { Exercise } from "../types";

export interface GenerateExerciseResponse {
  exercise: Exercise;
}

export interface UploadExercises {
    tagged_exercises: Exercise[],
    trending_lesson: string,
    trending_difficulty: "easy" | "medium" | "hard",
    suggested_exercise: Exercise
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

export async function UploadExercisesResponse(
    exercises: string[]
): Promise<UploadExercises> {
    const response = await apiClient.post<UploadExercises>("/upload/", {
        exercises
    });
    return response.data
}