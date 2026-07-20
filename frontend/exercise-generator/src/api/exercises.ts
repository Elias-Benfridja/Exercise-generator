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
  suggested_exercises: Exercise[];
  trend_narrative: string;
}

export interface Note {
  id: number;
  exercise: number;
  text: string;
}

export interface TogglePinResponse {
  pinned: boolean;
  review_at?: string;
  days?: number;
}

export type PinRating = "easy" | "medium" | "hard";

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

// Combines exercises from multiple already-tagged files (or batches) into
// one pooled trend analysis. Exercise IDs come from prior uploadExerciseFile
// calls.
export async function combineAnalysis(
  exerciseIds: number[]
): Promise<UploadExercisesResponse> {
  const response = await apiClient.post<UploadExercisesResponse>("/exercise/combine-analysis/", {
    exercise_ids: exerciseIds,
  });
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

export async function saveNote(exerciseId: number, text: string): Promise<Note> {
  const response = await apiClient.post<Note>(`/exercise/note/${exerciseId}/`, {
    text,
  });
  return response.data;
}

// Toggles a pin off (no arguments needed — the backend deletes any
// existing Pin for this user+exercise regardless of body content).
export async function unpinExercise(exerciseId: number): Promise<TogglePinResponse> {
  const response = await apiClient.post<TogglePinResponse>(`/exercise/pin/${exerciseId}/`);
  return response.data;
}

// Pins in "auto" mode: review interval is computed server-side from the
// exercise's AI-assigned difficulty plus how hard the user found it.
export async function pinExerciseAuto(
  exerciseId: number,
  rating: PinRating
): Promise<TogglePinResponse> {
  const response = await apiClient.post<TogglePinResponse>(`/exercise/pin/${exerciseId}/`, {
    mode: "auto",
    rating,
  });
  return response.data;
}

// Pins in "manual" mode: the user picks the exact number of days themselves.
export async function pinExerciseManual(
  exerciseId: number,
  days: number
): Promise<TogglePinResponse> {
  const response = await apiClient.post<TogglePinResponse>(`/exercise/pin/${exerciseId}/`, {
    mode: "manual",
    days,
  });
  return response.data;
}

export async function getDueReviews(): Promise<Exercise[]> {
  const response = await apiClient.get<Exercise[]>("/exercise/due-reviews/");
  return response.data;
}

export interface TopicMasteryEntry {
  topic: string;
  weakness_score: number;
  based_on: "ratings" | "frequency";
  sample_size: number;
}

export async function getTopicMastery(): Promise<TopicMasteryEntry[]> {
  const response = await apiClient.get<TopicMasteryEntry[]>("/exercise/topic-mastery/");
  return response.data;
}