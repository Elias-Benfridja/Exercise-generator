import { useState } from "react";
import type { Exercise, VerifyResult } from "../types";
import DifficultyBadge from "./DifficultyBadge";
import MathText from "./MathText";
import {
  verifyExercise,
  toggleFavorite,
  saveNote,
  unpinExercise,
  pinExerciseAuto,
  pinExerciseManual,
} from "../api/exercises";
import type { PinRating } from "../api/exercises";
import type { FormEvent } from "react";

interface ExerciseCardProps {
  exercise: Exercise;
}

// Normalizes an answer string for lenient comparison: strips whitespace,
// dollar signs (LaTeX wrapping), and case differences.
function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/\$/g, "");
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string>("");
  const [isFavorited, setIsFavorited] = useState(exercise.is_favorited);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Note editing state
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(exercise.my_note);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteSavedAt, setNoteSavedAt] = useState<number | null>(null);

  // Hints state
  const [revealedHints, setRevealedHints] = useState(0);

  // Answer-check state
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Pin state
  const [isPinned, setIsPinned] = useState(exercise.is_pinned);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinPickerOpen, setPinPickerOpen] = useState(false);
  const [pinMode, setPinMode] = useState<"auto" | "manual">("auto");
  const [pinRating, setPinRating] = useState<PinRating>("medium");
  const [pinDays, setPinDays] = useState("3");
  const [reviewAt, setReviewAt] = useState<string | null>(exercise.review_at);

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

  async function handleSaveNote() {
    setNoteSaving(true);
    setNoteError("");
    try {
      await saveNote(exercise.id, noteText);
      setNoteSavedAt(Date.now());
    } catch (err) {
      setNoteError("Could not save your note right now");
      console.log(err);
    } finally {
      setNoteSaving(false);
    }
  }

  function handleShowHint() {
    setRevealedHints((count) => Math.min(count + 1, exercise.hints.length));
  }

  function handleCheckAnswer(e: FormEvent) {
    e.preventDefault();
    if (!userAnswer.trim()) return;
    setIsCorrect(normalizeAnswer(userAnswer) === normalizeAnswer(exercise.answer_text));
  }

  async function handlePinButtonClick() {
    if (isPinned) {
      setPinLoading(true);
      try {
        const result = await unpinExercise(exercise.id);
        setIsPinned(result.pinned);
        setReviewAt(null);
      } catch (err) {
        console.log(err);
      } finally {
        setPinLoading(false);
      }
      return;
    }
    setPinPickerOpen((open) => !open);
  }

  async function handleConfirmPin() {
    setPinLoading(true);
    try {
      const result =
        pinMode === "auto"
          ? await pinExerciseAuto(exercise.id, pinRating)
          : await pinExerciseManual(exercise.id, parseInt(pinDays, 10) || 1);
      setIsPinned(result.pinned);
      setReviewAt(result.review_at ?? null);
      setPinPickerOpen(false);
    } catch (err) {
      console.log(err);
    } finally {
      setPinLoading(false);
    }
  }

  // Formats an ISO timestamp into a short, readable date for the
  // always-visible review-date badge.
  function formatReviewDate(iso: string): string {
    const date = new Date(iso);
    const today = new Date();
    const diffMs = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    if (diffDays <= 0) return `${formatted} (due now)`;
    if (diffDays === 1) return `${formatted} (tomorrow)`;
    return `${formatted} (in ${diffDays} days)`;
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

        <div className="relative">
          <button
            type="button"
            onClick={handlePinButtonClick}
            disabled={pinLoading}
            aria-label={isPinned ? "Remove from review pins" : "Pin for review"}
            className="text-outline hover:text-tertiary transition-colors disabled:opacity-50"
          >
            <span
              className="material-symbols-outlined"
              style={isPinned ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              push_pin
            </span>
          </button>

          {pinPickerOpen && (
            <div className="absolute top-full right-0 mt-2 z-20 w-80 bg-surface-container-lowest border border-surface-container rounded-xl shadow-lg p-4 space-y-4">
              {/* Auto / Manual toggle */}
              <div className="bg-surface-container-low p-1.5 rounded-lg flex gap-1">
                <button
                  type="button"
                  onClick={() => setPinMode("auto")}
                  className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${
                    pinMode === "auto"
                      ? "bg-white text-primary shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setPinMode("manual")}
                  className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${
                    pinMode === "manual"
                      ? "bg-white text-primary shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  Manual
                </button>
              </div>

              {pinMode === "auto" ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-on-surface-variant">
                    How hard did you find it?
                  </p>
                  <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as PinRating[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setPinRating(option)}
                        className={`flex-1 text-sm font-semibold py-2 rounded-md capitalize transition-all ${
                          pinRating === option
                            ? "bg-on-tertiary-container text-white"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    We'll pick a review date based on the exercise's difficulty and your rating.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-on-surface-variant">
                    Review in how many days?
                  </p>
                  <input
                    type="number"
                    min={1}
                    value={pinDays}
                    onChange={(e) => setPinDays(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-md py-2.5 px-3 text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmPin}
                disabled={pinLoading}
                className="w-full bg-on-tertiary-container text-white text-sm font-semibold py-2.5 rounded-md hover:opacity-90 transition-all disabled:opacity-60"
              >
                {pinLoading ? "Pinning..." : "Pin for Review"}
              </button>
            </div>
          )}
        </div>

        <DifficultyBadge difficulty={exercise.difficulty} />
      </div>
      <div className="p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6 text-on-primary-container">
          <span className="material-symbols-outlined">calculate</span>
          <span className="font-label-md text-xs font-medium uppercase tracking-wider">
            Exercise #{exercise.id}
          </span>
          {isPinned && reviewAt && (
            <span className="flex items-center gap-1 text-xs font-semibold text-tertiary bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[14px]">push_pin</span>
              Review: {formatReviewDate(reviewAt)}
            </span>
          )}
        </div>
        <div className="space-y-6">
          <p className="font-headline-md text-2xl font-semibold text-primary">
            <MathText text={exercise.question_text} />
          </p>

          {/* Answer input */}
          <form onSubmit={handleCheckAnswer} className="space-y-2">
            <label className="font-label-md text-sm font-semibold text-on-surface-variant block">
              Your Answer
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => {
                  setUserAnswer(e.target.value);
                  setIsCorrect(null);
                }}
                placeholder="Type your answer..."
                className="flex-1 bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface transition-all placeholder:text-outline"
              />
              <button
                type="submit"
                className="bg-surface-container-high text-primary px-5 py-2 rounded-lg font-label-md text-sm font-semibold hover:bg-surface-container transition-all shrink-0"
              >
                Check
              </button>
            </div>
            {isCorrect !== null && (
              <p
                className={`text-sm font-semibold flex items-center gap-1.5 ${
                  isCorrect ? "text-green-800" : "text-error"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isCorrect ? "check_circle" : "cancel"}
                </span>
                {isCorrect ? "Correct!" : "Not quite — try again or check a hint."}
              </p>
            )}
          </form>

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

            <button
              type="button"
              onClick={() => setNoteOpen(!noteOpen)}
              className="flex items-center gap-2 font-label-md text-sm font-semibold text-tertiary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">edit_note</span>
              {noteOpen ? "Hide Note" : exercise.my_note ? "Edit Note" : "Add Note"}
            </button>

            {exercise.hints.length > 0 && revealedHints < exercise.hints.length && (
              <button
                type="button"
                onClick={handleShowHint}
                className="flex items-center gap-2 font-label-md text-sm font-semibold text-amber-700 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">lightbulb</span>
                {revealedHints === 0 ? "Get a Hint" : "Next Hint"}
                <span className="text-xs text-outline">
                  ({revealedHints}/{exercise.hints.length})
                </span>
              </button>
            )}

            {revealedHints > 0 && (
              <div className="w-full mt-2 space-y-2">
                {exercise.hints.slice(0, revealedHints).map((hint, i) => (
                  <div
                    key={i}
                    className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3"
                  >
                    <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0">
                      lightbulb
                    </span>
                    <p className="text-sm text-amber-900">
                      <span className="font-semibold">Hint {i + 1}: </span>
                      <MathText text={hint} />
                    </p>
                  </div>
                ))}
              </div>
            )}

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

            {noteOpen && (
              <div className="w-full mt-2 p-6 bg-surface-container-low rounded-lg border border-surface-container">
                <label className="font-label-md text-sm font-semibold text-on-surface-variant block mb-2">
                  Your note
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => {
                    setNoteText(e.target.value);
                    setNoteSavedAt(null);
                  }}
                  placeholder="Jot down a reminder about this exercise..."
                  className="w-full h-24 p-4 bg-surface-container-lowest border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-on-surface resize-none transition-all placeholder:text-outline"
                />
                <div className="flex items-center justify-between mt-3">
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={noteSaving}
                    className="bg-on-tertiary-container text-white px-5 py-2 rounded-lg font-label-md text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {noteSaving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Note"
                    )}
                  </button>
                  {noteSavedAt && !noteSaving && (
                    <span className="text-sm text-on-surface-variant">Saved</span>
                  )}
                </div>
                {noteError && (
                  <p className="text-error text-sm font-semibold mt-2">{noteError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}