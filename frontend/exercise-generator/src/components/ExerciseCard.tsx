import { useState } from "react";
import type { Exercise, VerifyResult } from "../types";
import DifficultyBadge from "./DifficultyBadge";
import MathText from "./MathText";
import { verifyExercise, toggleFavorite } from "../api/exercises";

interface ExerciseCardProps {
  exercise: Exercise;
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string>("");
  const [isFavorited, setIsFavorited] = useState(exercise.is_favorited);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  async function handleVerify() {
    setVerifying(true);
    setVerifyError("");
    try {
      const result = await verifyExercise(exercise.id);
      setVerifyResult(result);
    } catch (err) {
      setVerifyError("Could not verify this answer right now");
      console.log(err);
    } finally {
      setVerifying(false);
    }
  }

  async function handleToggleFavorite() {
    setFavoriteLoading(true);
    try {
      const result = await toggleFavorite(exercise.id);
      setIsFavorited(result.favorited);
    } catch (err) {
      console.log(err);
    } finally {
      setFavoriteLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden bg-surface-container-lowest border border-surface-container rounded-xl shadow-[0px_8px_30px_rgba(24,29,58,0.06)]">
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={favoriteLoading}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          className="text-outline hover:text-error transition-colors disabled:opacity-50"
        >
          <span
            className="material-symbols-outlined"
            style={isFavorited ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            favorite
          </span>
        </button>
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

            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-2 font-label-md text-sm font-semibold text-secondary hover:text-primary transition-colors disabled:opacity-60"
            >
              {verifying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">verified</span>
                  Verify Answer
                </>
              )}
            </button>

            <div className={`reveal-transition w-full ${revealed ? "reveal-active" : ""}`}>
              <div className="mt-4 p-6 bg-surface-container-low rounded-lg border-l-4 border-tertiary">
                <p className="font-label-md text-sm font-semibold text-on-surface-variant mb-2">
                  Answer:
                </p>
                <p className="font-body-md text-base text-on-surface">
                  <MathText text={exercise.answer_text} />
                </p>
              </div>
            </div>

            {verifyError && (
              <p className="w-full text-error text-sm font-semibold">{verifyError}</p>
            )}

            {verifyResult && (
              <div
                className={`w-full mt-2 p-4 rounded-lg border ${
                  verifyResult.match
                    ? "bg-green-50 border-green-100 text-green-800"
                    : "bg-amber-50 border-amber-100 text-amber-800"
                }`}
              >
                <p className="text-sm font-semibold">
                  {verifyResult.match
                    ? `✓ Verified — ${verifyResult.votes}/3 independent solves agree`
                    : `⚠ Consensus differs from stored answer (${verifyResult.votes}/3 agreed on a different result)`}
                </p>
                {!verifyResult.match && (
                  <p className="text-sm mt-1">
                    Independent consensus: <MathText text={verifyResult.consensus_answer} />
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}