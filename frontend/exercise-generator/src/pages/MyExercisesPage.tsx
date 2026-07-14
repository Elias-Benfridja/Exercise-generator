import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Exercise } from "../types";
import ExerciseCard from "../components/ExerciseCard";
import { getMyHistory, getMyFavorites } from "../api/exercises";

type Tab = "history" | "favorites";

export default function MyExercisesPage() {
  const [tab, setTab] = useState<Tab>("history");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isLoggedIn = Boolean(localStorage.getItem("access_token"));

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = tab === "history" ? await getMyHistory() : await getMyFavorites();
        if (!cancelled) setExercises(data);
      } catch (err) {
        if (!cancelled) setError("Could not load your exercises right now");
        console.log(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tab, isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <main className="grow pt-32 pb-24 px-4 md:px-10">
        <div className="max-w-md mx-auto text-center bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] border border-surface-container p-10">
          <span className="material-symbols-outlined text-4xl text-outline mb-4 block">
            lock
          </span>
          <h1 className="font-headline-md text-2xl font-semibold text-primary mb-2">
            Log in to see your exercises
          </h1>
          <p className="font-body-md text-on-surface-variant mb-8">
            Your generation history and favorites are saved to your account.
            Log in or create one to view them.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="bg-on-tertiary-container text-white rounded-lg font-label-md text-sm font-semibold py-3 hover:brightness-110 transition-all"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="bg-surface-container-high text-primary rounded-lg font-label-md text-sm font-semibold py-3 hover:bg-surface-container transition-all"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grow pt-32 pb-24 px-4 md:px-10">
      <div className="max-w-200 mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display-lg text-5xl font-bold tracking-tight text-primary mb-4">
            My Exercises
          </h1>
          <p className="font-body-lg text-lg text-on-surface-variant max-w-150 mx-auto">
            Everything you've generated and everything you've saved.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="bg-surface-container-low p-1.5 rounded-lg flex gap-1 items-center h-14 max-w-sm w-full">
            <button
              type="button"
              onClick={() => setTab("history")}
              className={`flex-1 flex items-center justify-center gap-2 text-center py-2 rounded-md font-label-md text-sm font-semibold transition-all ${
                tab === "history"
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              History
            </button>
            <button
              type="button"
              onClick={() => setTab("favorites")}
              className={`flex-1 flex items-center justify-center gap-2 text-center py-2 rounded-md font-label-md text-sm font-semibold transition-all ${
                tab === "favorites"
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">favorite</span>
              Favorites
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <p className="text-error text-sm font-semibold text-center mb-6">{error}</p>
        )}

        {/* Empty state */}
        {!loading && !error && exercises.length === 0 && (
          <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-surface-container">
            <span className="material-symbols-outlined text-4xl text-outline mb-3 block">
              {tab === "history" ? "history" : "favorite"}
            </span>
            <p className="font-body-md text-on-surface-variant">
              {tab === "history"
                ? "You haven't generated any exercises yet."
                : "You haven't favorited any exercises yet."}
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && exercises.length > 0 && (
          <div className="space-y-6">
            {exercises.map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}