"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameShell";
import { FxHint, FxOverlay, shakeClass, useFx, MessageBar } from "../feedbackFx";

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

// 바구니 버튼: 색깔 있는 큰 버튼에 글자만 적습니다. 종류는 왼쪽 파랑 "채소" / 오른쪽 빨강 "과일",
// 색은 왼쪽 초록 "초록" / 오른쪽 빨강 "빨강"입니다.
const RULE_TEXT: Record<
  Rule,
  { title: string; left: string; right: string; leftBg: string; rightBg: string }
> = {
  color: {
    title: "색",
    left: "초록",
    right: "빨강",
    leftBg: "bg-emerald-500 hover:bg-emerald-400",
    rightBg: "bg-rose-500 hover:bg-rose-400",
  },
  kind: {
    title: "종류",
    left: "채소",
    right: "과일",
    leftBg: "bg-sky-500 hover:bg-sky-400",
    rightBg: "bg-rose-500 hover:bg-rose-400",
  },
};

// 단계별 설정: 규칙이 이어지는 길이(run) 목록, 규칙 글자를 계속 보여줄지
const CONFIG = {
  // 1단계: 주문이 한 번 바뀌고, 바구니 글자가 보여요.
  1: { runs: [4, 4] as number[], alwaysShowCue: true, frameCue: false },
  // 2단계: 재료에 금빛 액자가 있으면 "종류", 없으면 "색"으로 나눠요. 바구니 글자가 보여서 도와줘요.
  2: { runs: [4, 4, 2, 2] as number[], alwaysShowCue: true, frameCue: true },
  // 3단계: 2단계와 같지만 바구니 글자를 보여주지 않아요(액자 단서를 보고 기준을 떠올려요).
  3: { runs: [3, 3, 2, 2, 2, 2] as number[], alwaysShowCue: false, frameCue: true },
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
  // 빨강/과일은 오른쪽(빨간 버튼), 초록/채소는 왼쪽
  return (rule === "color" ? food.red : food.fruit) ? "right" : "left";
}

export default function ChefGame({ level, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const fx = useFx();
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
    // 3단계(액자 단서)는 처음에 한 번만 설명하고, 이후에는 액자 모양을 보고 스스로 기준을 정해요.
    if (cfg.frameCue ? index === 0 : trials[index].firstOfRun) {
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
  // 액자 단서 단계는 바구니 글자를 숨기고, 2번 연속 틀렸을 때만 다시 보여줍니다(힌트).
  const showCue = cfg.alwaysShowCue || fx.misses >= 2;
  const framed = cfg.frameCue && trial.rule === "kind"; // 액자가 있으면 종류, 없으면 색

  const choose = (side: "left" | "right") => {
    if (feedback || announcing) return;
    const ok = side === correctSide(trial.rule, trial.food);
    if (ok) correctRef.current += 1;
    if (ok) fx.hit("통과!");
    else fx.miss("앗!");
    const answer = correctSide(trial.rule, trial.food) === "left" ? text.left : text.right;
    setFeedback(
      ok
        ? { ok: true, text: "👍 맛있게 담겼어요!" }
        : {
            ok: false,
            text: cfg.frameCue
              ? `액자가 ${framed ? "있으면 종류" : "없으면 색"} 기준! ${trial.food.name}은(는) "${answer}" 바구니예요`
              : `지금은 ${text.title} 기준! ${trial.food.name}은(는) "${answer}" 바구니예요`,
          }
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
          {isChange && !cfg.frameCue ? "🔔" : "📝"}
        </p>
        <p className="text-lg font-extrabold text-[#00ff88]">
          {cfg.frameCue ? "식당의 비밀 주문" : isChange ? "손님이 주문을 바꿨어요!" : "첫 번째 주문이에요"}
        </p>
        {cfg.frameCue ? (
          <div className="w-full rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
            <p className="text-xl font-extrabold text-white">금빛 액자가 있으면 종류, 없으면 색!</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <div className="mx-auto flex h-20 w-24 items-center justify-center rounded-lg border-8 border-amber-400 bg-white/5 text-4xl">
                  🍎
                </div>
                <p className="mt-2 text-xs text-slate-300">액자 있음</p>
                <p className="mt-1 inline-block rounded-xl bg-white px-4 py-1 text-2xl font-extrabold text-slate-900">종류</p>
                <p className="mt-2 flex justify-center gap-1 text-xs font-extrabold text-white">
                  <span className="rounded-md bg-sky-500 px-2 py-0.5">채소</span>
                  <span className="rounded-md bg-rose-500 px-2 py-0.5">과일</span>
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <div className="mx-auto flex h-20 w-24 items-center justify-center rounded-lg border-8 border-transparent bg-white/5 text-4xl">
                  🍎
                </div>
                <p className="mt-2 text-xs text-slate-300">액자 없음</p>
                <p className="mt-1 inline-block rounded-xl bg-white px-4 py-1 text-2xl font-extrabold text-slate-900">색</p>
                <p className="mt-2 flex justify-center gap-1 text-xs font-extrabold text-white">
                  <span className="rounded-md bg-emerald-500 px-2 py-0.5">초록</span>
                  <span className="rounded-md bg-rose-500 px-2 py-0.5">빨강</span>
                </p>
              </div>
            </div>
            <p className="mt-4 text-base font-bold leading-relaxed text-white">
              재료에 액자가 있는지 보고, 위의 비밀대로 바구니에 넣어요.
            </p>
          </div>
        ) : (
        <div className="w-full rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
          <p className="text-sm text-slate-300">지금부터 이것으로 나눠요</p>
          <p className="mt-3 inline-block rounded-2xl bg-white px-10 py-3 text-5xl font-extrabold text-slate-900">
            {text.title}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-lg font-extrabold text-white">
            <div className={`rounded-xl px-3 py-4 ${text.leftBg}`}>{text.left}</div>
            <div className={`rounded-xl px-3 py-4 ${text.rightBg}`}>{text.right}</div>
          </div>
        </div>
        )}
        {cfg.frameCue ? (
          <p className="text-xs text-amber-300">
            {cfg.alwaysShowCue
              ? "액자가 있는지 보고 기준을 정해요. 바구니 글자가 도와줘요!"
              : "이번 단계는 바구니 글자가 없어요. 액자를 보고 비밀을 기억해요!"}
          </p>
        ) : (
          !cfg.alwaysShowCue && <p className="text-xs text-amber-300">이번 단계는 바구니 글자가 곧 사라져요. 잘 기억해요!</p>
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
    <div className={`relative flex flex-col items-center gap-4 text-center ${shakeClass(fx)}`}>
      <FxOverlay fx={fx} />
      <p className="text-xs text-slate-400">
        {index + 1} / {trials.length}
      </p>

      <div
        className={`flex h-44 w-full flex-col items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 ${
          framed ? "border-8 border-amber-400" : cfg.frameCue ? "border-8 border-transparent" : ""
        }`}
      >
        <p className="text-8xl leading-none" role="img" aria-label={trial.food.name}>
          {trial.food.emoji}
        </p>
        <p className="mt-1 text-sm font-bold text-slate-100">{trial.food.name}</p>
      </div>

      <MessageBar tone={feedback ? (feedback.ok ? "good" : "bad") : "info"}>
        {feedback ? feedback.text : "🧺 어느 바구니에 넣을까요?"}
      </MessageBar>
      <FxHint fx={fx}>
        {cfg.frameCue
          ? "액자가 있으면 종류, 없으면 색! 바구니 글자를 다시 보여줄게요."
          : `지금은 "${text.title}" 기준이에요! 바구니 글자를 다시 보여줄게요.`}
      </FxHint>

      <div className="grid w-full grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!!feedback}
          onClick={() => choose("left")}
          className={`rounded-2xl px-4 py-7 text-2xl font-extrabold text-white disabled:opacity-70 ${
            showCue ? text.leftBg : "bg-indigo-500 hover:bg-indigo-600"
          }`}
        >
          {showCue ? text.left : "왼쪽 바구니"}
        </button>
        <button
          type="button"
          disabled={!!feedback}
          onClick={() => choose("right")}
          className={`rounded-2xl px-4 py-7 text-2xl font-extrabold text-white disabled:opacity-70 ${
            showCue ? text.rightBg : "bg-indigo-500 hover:bg-indigo-600"
          }`}
        >
          {showCue ? text.right : "오른쪽 바구니"}
        </button>
      </div>
    </div>
  );
}
