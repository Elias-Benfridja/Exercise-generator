import { useState } from "react";
import { uploadExercises, uploadExerciseFile } from "../api/exercises";
import type { UploadExercisesResponse } from "../api/exercises";
import ExerciseCard from "../components/ExerciseCard";
import DifficultyBadge from "../components/DifficultyBadge";
import MathText from "../components/MathText";

export default function TrendAnalysisPage() {
  const [currentInput, setCurrentInput] = useState<string>("");
  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadExercisesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  function handleAddExercise() {
    if (!currentInput.trim()) {
      setError("Please enter an exercise before adding it");
      return;
    }
    setExercises([...exercises, currentInput.trim()]);
    setCurrentInput("");
    setError("");
  }

  function handleRemoveExercise(indexToRemove: number) {
    setExercises(exercises.filter((_, i) => i !== indexToRemove));
  }

  async function handleAnalyze() {
    if (exercises.length === 0) {
      setError("Add at least one exercise before analyzing");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await uploadExercises(exercises);
      setResult(response);
    } catch (err) {
      setError("Error analyzing exercises");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload() {
    if (!selectedFile) {
      setError("Please choose a file first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await uploadExerciseFile(selectedFile);
      setResult(response);
    } catch (err) {
      setError("Error analyzing file");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grow pt-24 pb-16 px-4 md:px-10 max-w-300 mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Section */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] border border-[#F0EFEB]">
            <h2 className="font-headline-md text-2xl font-semibold text-primary mb-4">
              Add Practice Problems
            </h2>
            <p className="text-on-surface-variant mb-6">
              Add exercises one at a time, or upload an exam file, then analyze the batch to find trends.
            </p>

            {/* File upload */}
            <div className="mb-6 pb-6 border-b border-[#F0EFEB]">
              <label className="font-label-md text-sm font-semibold text-on-surface-variant block mb-3">
                Upload an exam file (image or PDF)
              </label>
              <div className="flex gap-3">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="flex-1 text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-surface-container-high file:text-primary file:text-sm file:font-semibold hover:file:bg-surface-container"
                />
                <button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={loading || !selectedFile}
                  className="bg-on-tertiary-container text-on-tertiary px-6 py-2 rounded-lg font-label-md text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-sm disabled:opacity-50 shrink-0"
                >
                  Upload &amp; Analyze
                </button>
              </div>
            </div>

            {/* Manual add */}
            <div className="space-y-3">
              <label className="font-label-md text-sm font-semibold text-on-surface-variant">
                Or add exercises manually
              </label>
              <textarea
                value={currentInput}
                onChange={(e) => {
                  setCurrentInput(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Evaluate the derivative of f(x) = sin(x^2)"
                className="w-full h-32 p-6 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface resize-none transition-all placeholder:text-outline"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddExercise}
                  className="bg-surface-container-high text-primary px-6 py-2 rounded-lg font-label-md text-sm font-semibold hover:bg-surface-container transition-all active:scale-95"
                >
                  Add Exercise
                </button>
              </div>
            </div>

            {exercises.length > 0 && (
              <div className="mt-6 space-y-2">
                <span className="text-xs font-medium text-outline">
                  {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} added
                </span>
                {exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-start gap-4 p-4 rounded-lg bg-surface border border-[#F0EFEB]"
                  >
                    <p className="text-on-surface text-sm leading-relaxed">{ex}</p>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(i)}
                      className="text-outline hover:text-error transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {exercises.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#F0EFEB]">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-on-tertiary-container text-on-tertiary px-6 py-3 rounded-lg font-label-md text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Added Exercises"
                  )}
                </button>
              </div>
            )}

            {error && (
              <p className="text-error text-sm font-semibold mt-4">{error}</p>
            )}
          </div>

          {/* Extracted Analysis List */}
          {result && (
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] border border-[#F0EFEB]">
              <div className="flex justify-between items-end mb-6">
                <h3 className="font-headline-md text-2xl font-semibold text-primary">
                  Extracted Analysis
                </h3>
                <span className="text-xs font-medium text-outline">
                  Showing {result.tagged_exercises.length} detected items
                </span>
              </div>
              <div className="space-y-4">
                {result.tagged_exercises.map((tagged) => (
                  <div
                    key={tagged.id}
                    className="p-5 rounded-lg bg-surface hover:bg-surface-container-low transition-all border border-[#F0EFEB]"
                  >
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <p className="text-on-surface leading-relaxed">
                        <MathText text={tagged.question_text} />
                      </p>
                      <DifficultyBadge difficulty={tagged.difficulty} />
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-xs font-medium uppercase tracking-wider">
                        {tagged.topic}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sidebar Summary */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-primary text-on-primary p-8 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">insights</span>
            </div>
            <div className="relative z-10">
              <span className="text-xs font-medium text-primary-fixed-dim uppercase tracking-[0.2em] mb-4 block">
                Current Insight
              </span>
              <h2 className="font-headline-lg text-3xl font-bold mb-2">
                {result ? result.trending_lesson : "Awaiting analysis"}
              </h2>
              <p className="text-on-primary-container mb-6 opacity-80 italic">
                Most frequently appearing pattern in your uploaded exercises.
              </p>
              {result && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">Trending Difficulty:</span>
                  <span className="px-4 py-1.5 rounded-full bg-on-tertiary-container text-on-tertiary text-xs font-bold uppercase border border-white/20">
                    {result.trending_difficulty}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Suggested New Exercise */}
      {result && (
        <section className="mt-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] border-2 border-tertiary/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-on-tertiary-container">auto_awesome</span>
              <h3 className="font-headline-md text-2xl font-semibold text-primary">
                Suggested New Exercise
              </h3>
            </div>
            <ExerciseCard exercise={result.suggested_exercise} />
          </div>
        </section>
      )}
    </main>
  );
}