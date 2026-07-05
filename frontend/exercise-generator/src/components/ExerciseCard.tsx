import { useState } from "react";
import type { Exercise } from "../types";
import DifficultyBadge from "./DifficultyBadge";
import MathText from "./MathText";

interface ExerciseCardProps {
  exercise: Exercise;
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative overflow-hidden bg-surface-container-lowest border border-surface-container rounded-xl shadow-[0px_8px_30px_rgba(24,29,58,0.06)]">
      <div className="absolute top-6 right-6">
        <DifficultyBadge difficulty={exercise.difficulty} />
      </div>
      <div className="p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6 text-on-primary-container">
          <span className="material-symbols-outlined">calculate</span>
          <span className="font-label-md text-xs font-medium uppercase tracking-wider">
            Exercise #{exercise.id}
          </span>
        </div>
        <div className="space-y-6">
          <p className="font-headline-md text-2xl font-semibold text-primary">
            <MathText text={exercise.question_text} />
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              className="flex items-center gap-2 font-label-md text-sm font-semibold text-primary-container hover:text-primary transition-colors"
              onClick={() => setRevealed(!revealed)}
            >
              <span className="material-symbols-outlined">visibility</span>
              Reveal Answer
              <span
                className={`material-symbols-outlined transition-transform duration-300 ${
                  revealed ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </button>
            <div className={`reveal-transition w-full ${revealed ? "reveal-active" : ""}`}>
              <div className="mt-4 p-6 bg-surface-container-low rounded-lg border-l-4 border-tertiary">
                <p className="font-label-md text-sm font-semibold text-on-surface-variant mb-2">
                  Answer:
                </p>
                <p className="font-body-md text-base text-on-surface">
                  <MathText text={exercise.question_text} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}