import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Exercise } from "../types";
import { getDueReviews, unpinExercise } from "../api/exercises";
import MathText from "./MathText";

interface DueReviewsPopupProps {
  onClose: () => void;
  onExerciseCleared?: () => void;
}

export default function DueReviewsPopup({ onClose, onExerciseCleared }: DueReviewsPopupProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingId, setClearingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getDueReviews();
        if (!cancelled) setExercises(data);
      } catch (err) {
        console.log(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleExerciseClick(exercise: Exercise) {
    onClose();
    let exerciseToShow = exercise;
    try {
      await unpinExercise(exercise.id);
      exerciseToShow = { ...exercise, is_pinned: false, review_at: null };
      onExerciseCleared?.();
    } catch (err) {
      console.log(err);
    }
    navigate("/", { state: { generatedExercise: exerciseToShow } });
  }

  async function handleClear(e: MouseEvent, exerciseId: number) {
    e.stopPropagation();
    setClearingId(exerciseId);
    try {
      await unpinExercise(exerciseId);
      setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
      onExerciseCleared?.();
    } catch (err) {
      console.log(err);
    } finally {
      setClearingId(null);
    }
  }

  return (
    <div className="absolute top-16 right-4 md:right-10 z-50 w-80 bg-surface-container-lowest border border-surface-container rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-label-md text-sm font-semibold text-primary">Due for Review</h3>
        <button type="button" onClick={onClose} className="text-outline hover:text-primary">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {loading && <p className="text-sm text-on-surface-variant">Loading...</p>}

      {!loading && exercises.length === 0 && (
        <p className="text-sm text-on-surface-variant">Nothing due right now.</p>
      )}

      {!loading && exercises.length > 0 && (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {exercises.map((ex) => (
            <li key={ex.id}>
              <div className="w-full flex items-center gap-1 rounded-md px-2 py-1.5 -mx-2 hover:bg-surface-container-low transition-colors group">
                <button
                  type="button"
                  onClick={() => handleExerciseClick(ex)}
                  className="flex-1 min-w-0 flex items-center gap-2 text-left text-sm text-on-surface group-hover:text-primary transition-colors"
                >
                  <span className="truncate">
                    <MathText text={ex.question_text} />
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary shrink-0">
                    chevron_right
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleClear(e, ex.id)}
                  disabled={clearingId === ex.id}
                  aria-label="Clear from due reviews"
                  className="shrink-0 text-outline hover:text-error transition-colors disabled:opacity-40"
                >
                  {clearingId === ex.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-outline/40 border-t-error rounded-full animate-spin block" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && exercises.length > 0 && (
        <Link
          to="/my-exercises"
          onClick={onClose}
          className="block mt-3 text-center text-sm font-semibold text-primary hover:underline"
        >
          View all in My Exercises
        </Link>
      )}
    </div>
  );
}