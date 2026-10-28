"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameShell";
import { FxHint, FxOverlay, shakeClass, useFx, MessageBar } from "../feedbackFx";

/**
 * 여행 가방 챙기기 (작업기억 - 기억 용량 놀이).
 * 물건 몇 개가 한꺼번에 잠깐 보였다가 사라지면, 후보 물건 중에서 보였던 것을 모두 골라 가방에 담습니다.
 * 순서는 묻지 않고, 한 번에 몇 개를 기억해 두는지(용량)를 연습합니다. 단계가 오를수록 물건이 많아집니다.
 * ⚠️ 놀이이므로 정답을 바로 알려줍니다. 결과는 별 개수 외에 저장하지 않습니다.
 */

const ITEMS = [
  { emoji: "🧢", name: "모자" },
  { emoji: "🧦", name: "양말" },
  { emoji: "🔦", name: "손전등" },
  { emoji: "🧭", name: "나침반" },
  { emoji: "📷", name: "카메라" },
  { emoji: "🧴", name: "선크림" },
  { emoji: "🪥", name: "칫솔" },
  { emoji: "🍪", name: "과자" },
  { emoji: "🧃", name: "주스" },
  { emoji: "🪁", name: "연" },
  { emoji: "🗺️", name: "지도" },
  { emoji: "🕶️", name: "선글라스" },
];

// 단계별 설정: 각 판에서 보여줄 물건 수, 후보 중 헷갈리는 물건 수, 물건을 보여주는 시간(ms)
const CONFIG = {
  1: { sizes: [2, 2, 3, 3], distractors: 3, showMs: 3500 },
  2: { sizes: [3, 3, 4, 4, 5], distractors: 4, showMs: 3800 },
  3: { sizes: [4, 4, 5, 5, 6], distractors: 5, showMs: 3600 },
} as const;

interface Round {
  shown: number[]; // ITEMS 인덱스
  options: number[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeRounds(level: 1 | 2 | 3): Round[] {
  const cfg = CONFIG[level];
  return cfg.sizes.map((size) => {
    const pool = shuffle(ITEMS.map((_, i) => i));
    const shown = pool.slice(0, size);
    const distractors = pool.slice(size, size + cfg.distractors);
    return { shown, options: shuffle([...shown, ...distractors]) };
  });
}

type Phase = "show" | "choose" | "feedback";

export default function SuitcaseGame({ level, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const fx = useFx();
  const [rounds] = useState<Round[]>(() => makeRounds(level));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("show");
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const correctRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishedRef = useRef(false);

  const schedule = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(setTimeout(fn, ms));
  };
  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  // 판이 바뀔 때마다 물건을 보여주고, 시간이 지나면 가방 담기 단계로 넘어갑니다.
  useEffect(() => {
    setPhase("show");
    setSelected([]);
    setResult(null);
    schedule(() => setPhase("choose"), cfg.showMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const round = rounds[index];

  const judge = (picked: number[]) => {
    const ok = picked.length === round.shown.length && round.shown.every((item) => picked.includes(item));
    const hits = picked.filter((item) => round.shown.includes(item)).length;
    if (ok) correctRef.current += 1;
    if (ok) fx.hit("통과!");
    else fx.miss("앗!");
    setResult({
      ok,
      text: ok
        ? "🎉 모두 챙겼어요!"
        : `${round.shown.length}개 중 ${hits}개를 챙겼어요. 초록 테두리가 원래 있던 물건이에요!`,
    });
    setPhase("feedback");
    schedule(() => {
      if (index + 1 >= rounds.length) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinish({ correct: correctRef.current, total: rounds.length });
        }
        return;
      }
      setIndex(index + 1);
    }, ok ? 1200 : 2400);
  };

  const toggle = (item: number) => {
    if (phase !== "choose") return;
    if (selected.includes(item)) {
      setSelected(selected.filter((x) => x !== item));
      return;
    }
    if (selected.length >= round.shown.length) return;
    const next = [...selected, item];
    setSelected(next);
    if (next.length === round.shown.length) judge(next);
  };

  return (
    <div className={`relative flex flex-col items-center gap-4 text-center ${shakeClass(fx)}`}>
      <FxOverlay fx={fx} />
      <p className="text-xs text-slate-400">
        {index + 1} / {rounds.length} · 물건 {round.shown.length}개
      </p>

      {phase === "show" && (
        <>
          <MessageBar>👀 물건을 한꺼번에 잘 보고 기억해요!</MessageBar>
          <div className="flex min-h-[8rem] flex-wrap justify-center gap-3">
            {round.shown.map((item) => (
              <div
                key={item}
                className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/30"
              >
                <span className="text-5xl" role="img" aria-label={ITEMS[item].name}>{ITEMS[item].emoji}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {phase !== "show" && (
        <>
          {!result && (
            <MessageBar>
              🧳 방금 본 물건을 <strong className="text-indigo-600">{round.shown.length}개</strong> 골라 가방에 담아요
            </MessageBar>
          )}
          <div className="flex max-w-md flex-wrap justify-center gap-3">
            {round.options.map((item) => {
              const isSelected = selected.includes(item);
              const wasShown = round.shown.includes(item);
              const showAnswer = phase === "feedback";
              return (
                <button
                  key={item}
                  type="button"
                  disabled={phase !== "choose"}
                  onClick={() => toggle(item)}
                  className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl transition-colors ${
                    showAnswer && wasShown
                      ? "bg-[#00ff88]/20 ring-4 ring-[#00ff88]"
                      : showAnswer && isSelected
                        ? "bg-amber-400/20 ring-2 ring-amber-300"
                        : isSelected
                          ? "bg-indigo-400/40 ring-2 ring-indigo-300"
                          : "bg-white/10 ring-1 ring-white/20 hover:bg-white/20"
                  }`}
                >
                  <span className="text-5xl" role="img" aria-label={ITEMS[item].name}>{ITEMS[item].emoji}</span>
                  </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">
            담은 개수 {selected.length} / {round.shown.length}
          </p>
        </>
      )}

      {result && <MessageBar tone={result.ok ? "good" : "bad"}>{result.text}</MessageBar>}
      <FxHint fx={fx}>물건들로 짧은 이야기를 지어 보세요. (모자를 쓰고, 양말을 신고, 손전등을 들었어요)</FxHint>
    </div>
  );
}
