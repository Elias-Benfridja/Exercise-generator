import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTopicMastery, practiceWeakness } from "../api/exercises";
import type { TopicMasteryEntry } from "../api/exercises";

export default function TopicMasteryCard() {
  const [entries, setEntries] = useState<TopicMasteryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [practicingTopic, setPracticingTopic] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getTopicMastery();
        if (!cancelled) setEntries(data);
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

  async function handlePracticeClick(topic: string) {
    setPracticingTopic(topic);
    setError("");
    try {
      const exercise = await practiceWeakness(topic);
      navigate("/", { state: { generatedExercise: exercise } });
    } catch (err) {
      setError("Could not generate a practice exercise right now");
      console.log(err);
    } finally {
      setPracticingTopic(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] border border-[#F0EFEB]">
        <div className="flex justify-center py-6">
          <span className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] border border-[#F0EFEB]">
        <h3 className="font-headline-md text-xl font-semibold text-primary mb-2">
          Weak Topics
        </h3>
        <p className="text-base text-on-surface-variant">
          Keep pinning and rating exercises — once you've built up enough history on a topic,
          we'll show you where to focus.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] border border-[#F0EFEB]">
      <h3 className="font-headline-md text-xl font-semibold text-primary mb-1">
        Weak Topics
      </h3>
      <p className="text-sm text-on-surface-variant mb-4">
        Based on how you've rated your most recent pinned exercises on each topic.
      </p>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.topic}
            className="p-4 rounded-lg bg-surface border border-[#F0EFEB] flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-base font-semibold text-on-surface truncate capitalize">
                {entry.topic}
              </p>
              <p className="text-sm text-on-surface-variant">
                Based on {entry.sample_size} rated exercise{entry.sample_size !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlePracticeClick(entry.topic)}
              disabled={practicingTopic === entry.topic}
              className="shrink-0 bg-on-tertiary-container text-white text-sm font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {practicingTopic === entry.topic ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                "Practice"
              )}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-error text-sm font-semibold mt-3">{error}</p>}
    </div>
  );
}