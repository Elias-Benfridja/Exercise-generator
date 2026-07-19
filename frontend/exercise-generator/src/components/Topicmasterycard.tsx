import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTopicMastery } from "../api/exercises";
import type { TopicMasteryEntry } from "../api/exercises";

export default function TopicMasteryCard() {
  const [entries, setEntries] = useState<TopicMasteryEntry[]>([]);
  const [loading, setLoading] = useState(true);
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

  function handlePracticeClick(topic: string) {
    navigate("/", { state: { prefillTopic: topic } });
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
        <h3 className="font-headline-md text-lg font-semibold text-primary mb-2">
          Weak Topics
        </h3>
        <p className="text-sm text-on-surface-variant">
          Keep practicing and pinning exercises — once you've built up enough history on a
          topic, we'll show you where to focus.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_4px_20px_rgba(24,29,58,0.04)] border border-[#F0EFEB]">
      <h3 className="font-headline-md text-lg font-semibold text-primary mb-1">
        Weak Topics
      </h3>
      <p className="text-xs text-on-surface-variant mb-4">
        Based on your ratings where we have enough data, otherwise how often you practice a
        topic.
      </p>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.topic}
            className="p-3 rounded-lg bg-surface border border-[#F0EFEB] flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate capitalize">
                {entry.topic}
              </p>
              <p className="text-xs text-on-surface-variant">
                {entry.based_on === "ratings"
                  ? `Based on ${entry.sample_size} rated exercise${entry.sample_size !== 1 ? "s" : ""}`
                  : `Based on ${entry.sample_size} practiced exercise${entry.sample_size !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlePracticeClick(entry.topic)}
              className="shrink-0 bg-on-tertiary-container text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:opacity-90 transition-all"
            >
              Practice
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}