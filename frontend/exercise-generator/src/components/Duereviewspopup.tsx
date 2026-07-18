import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Exercise } from "../types";
import { getDueReviews } from "../api/exercises";

interface DueReviewsPopupProps {
  onClose: () => void;
}

export default function DueReviewsPopup({ onClose }: DueReviewsPopupProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

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
            <li key={ex.id} className="text-sm text-on-surface truncate">
              {ex.question_text}
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