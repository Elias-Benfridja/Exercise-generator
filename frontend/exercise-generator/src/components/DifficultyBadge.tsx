import type { DifficultyCode } from "../types";

interface DifficultyBadgeProps {
  difficulty: DifficultyCode;
}

const STYLES: Record<DifficultyCode, string> = {
  E: "bg-green-50 text-green-800 border-green-100",
  M: "bg-amber-50 text-amber-800 border-amber-100",
  H: "bg-red-50 text-error border-red-100",
};

const LABELS: Record<DifficultyCode, string> = {
  E: "Easy",
  M: "Medium",
  H: "Hard",
};

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <span
      className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border ${STYLES[difficulty]}`}
    >
      {LABELS[difficulty]}
    </span>
  );
}