"use client";

export type ResultViewMode = "easy" | "detail";

interface ResultViewToggleProps {
  mode: ResultViewMode;
  onChange: (mode: ResultViewMode) => void;
}

// 결과 화면에서 "쉬운 결과 보기" / "상세 결과 보기"를 전환하는 탭 (섹션 13)
export default function ResultViewToggle({ mode, onChange }: ResultViewToggleProps) {
  return (
    <div className="flex justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange("easy")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          mode === "easy" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        쉬운 결과 보기
      </button>
      <button
        type="button"
        onClick={() => onChange("detail")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          mode === "detail" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        상세 결과 보기
      </button>
    </div>
  );
}
