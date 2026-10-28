"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameShell";

/**
 * 변덕쟁이 요리사 (인지적 유연성 놀이).
 * 재료를 손님의 주문 규칙(색깔 또는 종류)에 맞게 왼쪽/오른쪽 바구니에 나눕니다. 주문은 가끔 바뀝니다.
 * 규칙은 한동안 이어지다가 바뀌고, 바뀔 때마다 알림이 나옵니다.
 * 단계가 오를수록 단서를 줄입니다: 1~2단계는 바구니에 규칙이 적혀 있고, 3단계는 규칙이 바뀐 직후에만 적혀 있어요.
 * ⚠️ 놀이이므로 정답을 바로 알려줍니다. 결과는 별 개수 외에 저장하지 않습니다.
 */

type Rule = "color" | "kind";
interface Food {
  emoji: string;
  name: string;
  red: boolean; // true면 빨강, false면 초록
  fruit: boolean; // true면 과일, false면 채소
}

const FOODS: Food[] = [
  { emoji: "🍎", name: "사과", red: true, fruit: true },
  { emoji: "🍓", name: "딸기", red: true, fruit: true },
  { emoji: "🍏", name: "풋사과", red: false, fruit: true },
  { emoji: "🍐", name: "배", red: false, fruit: true },
  { emoji: "🍅", name: "토마토", red: true, fruit: false },
  { emoji: "🌶️", name: "고추", red: true, fruit: false },
  { emoji: "🥦", name: "브로콜리", red: false, fruit: false },
  { emoji: "🥒", name: "오이", red: false, fruit: false },
];

const RULE_TEXT: Record<Rule, { title: string; left: string; right: string; icon: string }> = {
  color: { title: "색깔로 나눠요", left: "🔴 빨간 것", right: "🟢 초록 것", icon: "🎨" },
  kind: { title: "종류로 나눠요", left: "🍎 과일", right: "🥦 채소", icon: "🍽️" },
};

// 단계별 설정: 규칙이 이어지는 길이(run) 목록, 규칙 글자를 계속 보여줄지
const CONFIG = {
  1: { runs: [4, 4] as number[], alwaysShowCue: true },
  2: { runs: [4, 4, 2, 2] as number[], alwaysShowCue: true },
  3: { runs: [3, 3, 2, 2, 2, 2, 2] as number[], alwaysShowCue: false },
} as const;

interface Trial {
  rule: Rule;
  food: Food;
  firstOfRun: boolean;
  runPosition: number; // 규칙이 바뀐 뒤 몇 번째 재료인지 (0부터)
}

function makeTrials(level: 1 | 2 | 3): Trial[] {
  const trials: Trial[] = [];
  let rule: Rule = "color";
  CONFIG[level].runs.forEach((runLength) => {
    for (let i = 0; i < runLength; i++) {
      trials.push({
        rule,
        food: FOODS[Math.floor(Math.random() * FOODS.length)],
        firstOfRun: i === 0,
        runPosition: i,
      });
    }
    rule = rule === "color" ? "kind" : "color";
  });
  return trials;
}

// 정답 바구니: 색깔은 빨강=왼쪽/초록=오른쪽, 종류는 과일=왼쪽/채소=오른쪽
function correctSide(rule: Rule, food: Food): "left" | "right" {
  return (rule === "color" ? food.red : food.fruit) ? "left" : "right";
}

export default function ChefGame({ level, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const [trials] = useState<Trial[]>(() => makeTrials(level));
  const [index, setIndex] = useState(0);
  const [announcing, setAnnouncing] = useState(true);
  const [announceReady, setAnnounceReady] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const correctRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishedRef = useRef(false);

  const schedule = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(setTimeout(fn, ms));
  };
  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  // 규칙이 시작되거나 바뀔 때 알림을 보여줍니다 (잠깐 기다린 뒤 "알겠어요" 활성화).
  useEffect(() => {
    if (trials[index].firstOfRun) {
      setAnnouncing(true);
      setAnnounceReady(false);
      schedule(() => setAnnounceReady(true), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const trial = trials[index];
  const text = RULE_TEXT[trial.rule];
  const isChange = index > 0;
  // 3단계는 규칙이 바뀐 직후 첫 재료에서만 바구니 글자를 보여줍니다.
  const showCue = cfg.alwaysShowCue || trial.runPosition === 0;

  const choose = (side: "left" | "right") => {
    if (feedback || announcing) return;
    const ok = side === correctSide(trial.rule, trial.food);
    if (ok) correctRef.current += 1;
    const answer = correctSide(trial.rule, trial.food) === "left" ? text.left : text.right;
    setFeedback(
      ok
        ? { ok: true, text: "👍 맛있게 담겼어요!" }
        : { ok: false, text: `이번 주문은 ${text.title}. ${trial.food.name}은(는) "${answer}" 바구니예요` }
    );
    schedule(() => {
      setFeedback(null);
      if (index + 1 >= trials.length) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinish({ correct: correctRef.current, total: trials.length });
        }
        return;
      }
      setIndex(index + 1);
    }, ok ? 800 : 1900);
  };

  if (announcing) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-5xl" aria-hidden="true">
          {isChange ? "🔔" : "📝"}
        </p>
        <p className="text-lg font-extrabold text-[#00ff88]">
          {isChange ? "손님이 주문을 바꿨어요!" : "첫 번째 주문이에요"}
        </p>
        <div className="w-full rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
          <p className="text-2xl font-extrabold text-white">
            {text.icon} {text.title}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs text-slate-300">← 왼쪽 바구니</p>
              <p className="mt-1 text-white">{text.left}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs text-slate-300">오른쪽 바구니 →</p>
              <p className="mt-1 text-white">{text.right}</p>
            </div>
          </div>
        </div>
        {!cfg.alwaysShowCue && (
          <p className="text-xs text-amber-300">이번 단계는 바구니 글자가 곧 사라져요. 잘 기억해요!</p>
        )}
        <button
          type="button"
          disabled={!announceReady}
          onClick={() => setAnnouncing(false)}
          className="w-full rounded-full bg-indigo-500 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          {announceReady ? "알겠어요, 요리 시작!" : "읽는 중..."}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-xs text-slate-400">
        {index + 1} / {trials.length}
      </p>

      <div className="flex h-36 w-full flex-col items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
        <p className="text-6xl" role="img" aria-label={trial.food.name}>
          {trial.food.emoji}
        </p>
        <p className="mt-1 text-sm font-bold text-slate-100">{trial.food.name}</p>
      </div>

      <p
        className={`min-h-[3rem] text-base font-bold ${feedback ? (feedback.ok ? "text-[#00ff88]" : "text-amber-300") : "text-slate-300"}`}
        aria-live="polite"
      >
        {feedback ? feedback.text : "🧺 어느 바구니에 넣을까요?"}
      </p>

      <div className="grid w-full grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!!feedback}
          onClick={() => choose("left")}
          className="rounded-2xl bg-indigo-500 px-4 py-6 text-lg font-extrabold text-white hover:bg-indigo-600 disabled:opacity-70"
        >
          ← {showCue ? text.left : "왼쪽 바구니"}
        </button>
        <button
          type="button"
          disabled={!!feedback}
          onClick={() => choose("right")}
          className="rounded-2xl bg-indigo-500 px-4 py-6 text-lg font-extrabold text-white hover:bg-indigo-600 disabled:opacity-70"
        >
          {showCue ? text.right : "오른쪽 바구니"} →
        </button>
      </div>
    </div>
  );
}
