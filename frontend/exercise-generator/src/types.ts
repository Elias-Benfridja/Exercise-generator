export type DifficultyCode = "E" | "M" | "H";

export interface Exercise {
  id: number;
  topic: string;
  difficulty: DifficultyCode;
  question_text: string;
  answer_text: string;
  source: "G" | "S" | "U";
}