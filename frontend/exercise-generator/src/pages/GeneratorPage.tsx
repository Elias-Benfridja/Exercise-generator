import { useState } from "react";
import { generateExercise } from "../api/exercises";
import type { Exercise } from "../types";
import ExerciseCard from "../components/ExerciseCard";

export default function GeneratorPage() {
  // TODO: topic input state, difficulty selection state, submit handler, result state — we'll wire these together next.
  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [result, setResult] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function handleSubmit() {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await generateExercise(topic, difficulty);
      setResult(response);
    } catch (err) {
      setError("Error generating exercise");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grow pt-32 pb-24 px-4 md:px-10">
      <div className="max-w-200 mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display-lg text-5xl font-bold tracking-tight text-primary mb-4">
            Generate a Math Exercise.
          </h1>
          <p className="font-body-lg text-lg text-on-surface-variant max-w-150 mx-auto">
            Select your topic and difficulty level to create a custom practice
            problem.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] p-8 mb-12 border border-surface-container">
          <form
            className="space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="space-y-3">
              <label
                className="font-label-md text-sm font-semibold text-on-surface-variant"
                htmlFor="topic"
              >
                Mathematics Topic
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">
                  function
                </span>
                <input
                  id="topic"
                  placeholder="e.g. quadratic equations"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="font-label-md text-sm font-semibold text-on-surface-variant">
                Difficulty Level
              </label>
              <div className="bg-surface-container-low p-1.5 rounded-lg flex gap-1 items-center h-14">
                {/* TODO: turn these into controlled selectable pills */}
                <button
                  type="button"
                  onClick={() => setDifficulty("easy")}
                  className={`flex-1 text-center py-2 rounded-md font-label-md text-sm font-semibold transition-all ${
                    difficulty === "easy"
                      ? "bg-white text-green-800 shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  Easy
                </button>
                <button
                  type="button"
                  onClick={() => setDifficulty("medium")}
                  className={`flex-1 text-center py-2 rounded-md font-label-md text-sm font-semibold transition-all ${
                    difficulty === "medium"
                      ? "bg-white text-amber-800 shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setDifficulty("hard")}
                  className={`flex-1 text-center py-2 rounded-md font-label-md text-sm font-semibold transition-all ${
                    difficulty === "hard"
                      ? "bg-white text-error shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  Hard
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-on-tertiary-container text-white rounded-lg font-label-md text-sm font-semibold hover:bg-[#b87d4e] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">
                      auto_awesome
                    </span>
                    Generate Exercise
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      {error && (
        <p className="text-error text-sm font-semibold text-center mb-6">
          {error}
        </p>
      )}

      {result && <ExerciseCard exercise={result} />}
    </main>
  );
}
