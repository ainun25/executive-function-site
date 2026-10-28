import type { ReactNode } from "react";

// 지구 수호대 작전(스토리형 검사 1~3부)에서 공통으로 쓰는 이야기 연출 조각입니다.
// 정답 여부를 알려주는 연출은 쓰지 않습니다(검사 중 정답 비공개 원칙).

/** 본부 대장(또는 무전)이 말하는 말풍선. radio가 true면 "본부 무전" 연출입니다. */
export function CommanderSay({ children, radio }: { children: ReactNode; radio?: boolean }) {
  return (
    <div className="flex w-full items-start gap-3 text-left">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1a1f3c] text-2xl ring-2 ring-[#00ff88]"
        aria-hidden="true"
      >
        {radio ? "📻" : "🧑‍🚀"}
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-[#a2ffcf]">{radio ? "본부 무전" : "지구 수호대 본부 대장"}</p>
        <div className="mt-1 rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 text-sm leading-relaxed text-white ring-1 ring-white/15">
          {children}
        </div>
      </div>
    </div>
  );
}

/** 우주선이 지구까지 날아가는 진행 막대. 숫자 대신 이야기로 진행 정도를 보여줍니다. */
export function StoryProgress({ current, total }: { current: number; total: number }) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
  return (
    <div className="w-full max-w-xs" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}>
      <div className="relative h-8">
        <div className="absolute left-0 right-6 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/15">
          <div className="h-full rounded-full bg-[#00ff88]" style={{ width: `${ratio * 100}%` }} />
        </div>
        <span
          className="absolute top-0 text-2xl"
          style={{ left: `calc((100% - 3.5rem) * ${ratio})` }}
          aria-hidden="true"
        >
          🚀
        </span>
        <span className="absolute right-0 top-0 text-2xl" aria-hidden="true">
          🌍
        </span>
      </div>
      <span className="sr-only">
        {current} / {total}
      </span>
    </div>
  );
}
