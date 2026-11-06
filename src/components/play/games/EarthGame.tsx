"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameShell";
import { FxHint, FxOverlay, shakeClass, useFx, MessageBar } from "../feedbackFx";
import EarthGuardStimulus, { type EarthGuardLevel } from "../EarthGuardStimulus";

/**
 * 지구 수호대 작전 (억제통제 놀이, Go/No-Go).
 * 아군이 나오면 빠르게 터치하고(우세한 반응), 적군이 나오면 터치하지 않고 참습니다(반응 억제).
 * 단계마다 아군/적군을 구분하는 단서가 달라집니다: 1 행성(고리/가시) · 2 UFO(불꽃) · 3 요원(고글).
 * ⚠️ 놀이이므로 정답을 바로 알려줍니다. 결과는 별 개수 외에 저장하지 않습니다.
 */

const TRIALS = 15;
const ALLY_RATIO = 0.7;
const PRE_STIMULUS_MS = 1100; // 자극이 나타나기 전 대기
const RESPONSE_WINDOW_MS = 1500; // 반응할 수 있는 시간
const FEEDBACK_MS = 1000; // 반응 직후 피드백을 보여주는 시간

const CUES: Record<EarthGuardLevel, string> = {
  1: "아군 행성은 고리가 있고, 적군 행성은 뾰족한 가시가 있어요.",
  2: "아군 UFO는 동그란 불꽃, 적군 UFO는 뾰족한 불꽃이에요.",
  3: "적군 요원은 검은 고글을 쓰고 있어요.",
};

type Phase = "wait" | "stimulus" | "feedback";

function makeSequence(): boolean[] {
  const allyCount = Math.round(TRIALS * ALLY_RATIO);
  const sequence = Array.from({ length: TRIALS }, (_, i) => i < allyCount);
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }
  return sequence;
}

export default function EarthGame({ level, onFinish }: GameProps) {
  const fx = useFx();
  const [started, setStarted] = useState(false);
  const [sequence] = useState<boolean[]>(makeSequence);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("wait");
  const [message, setMessage] = useState("");
  const [lastOk, setLastOk] = useState<boolean | null>(null);

  const phaseRef = useRef<Phase>("wait");
  const indexRef = useRef(0);
  const correctRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishedRef = useRef(false);

  const changePhase = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };
  const schedule = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(setTimeout(fn, ms));
  };
  const clearAll = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => clearAll, []);

  const runTrial = (i: number) => {
    indexRef.current = i;
    setIndex(i);
    setMessage("");
    setLastOk(null);
    changePhase("wait");
    schedule(() => {
      changePhase("stimulus");
      schedule(() => {
        if (phaseRef.current !== "stimulus") return;
        // 시간 안에 터치하지 않음: 아군이면 놓친 것, 적군이면 잘 참은 것
        if (sequence[i]) settle(false, "아군을 놓쳤어요! 아군이 나오면 얼른 터치해요");
        else settle(true, "✋ 잘 참았어요! 적군이었어요 👍");
      }, RESPONSE_WINDOW_MS);
    }, PRE_STIMULUS_MS);
  };

  const settle = (ok: boolean, text: string) => {
    clearAll();
    if (ok) {
      correctRef.current += 1;
      fx.hit(sequence[indexRef.current] ? "반가워요!" : "잘 참았어요!");
    } else {
      fx.miss("앗!");
    }
    setLastOk(ok);
    setMessage(text);
    changePhase("feedback");
    schedule(() => {
      const next = indexRef.current + 1;
      if (next >= TRIALS) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinish({ correct: correctRef.current, total: TRIALS });
        }
        return;
      }
      runTrial(next);
    }, FEEDBACK_MS);
  };

  const touch = () => {
    // 자극이 나타나기 전/후의 입력과, 한 문항에서의 두 번째 이상 입력은 무시합니다.
    if (phaseRef.current !== "stimulus") return;
    if (sequence[indexRef.current]) settle(true, "🤝 반가워요! 아군에게 잘 인사했어요 👍");
    else settle(false, "앗, 적군이었어요! 적군이 나오면 터치하지 말고 꾹 참아요");
  };

  const begin = () => {
    setStarted(true);
    runTrial(0);
  };

  // PC에서는 스페이스바/엔터로도 반응할 수 있습니다. (키를 누르고 있을 때의 반복 입력은 무시)
  const touchRef = useRef(touch);
  useEffect(() => {
    touchRef.current = touch;
  });
  useEffect(() => {
    if (!started) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        touchRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [started]);

  const visual = level as EarthGuardLevel;

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-full rounded-2xl bg-white/5 px-4 py-5 ring-1 ring-white/15">
          <p className="text-sm text-slate-300">이번 작전의 아군과 적군을 잘 봐 두세요</p>
          <div className="mt-3 flex w-full justify-evenly">
            <GuideExample level={visual} isAlly />
            <GuideExample level={visual} isAlly={false} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{CUES[visual]}</p>
        </div>
        <MessageBar>아군은 빠르게 터치! 적군은 꾹 참기!</MessageBar>
        <button
          type="button"
          onClick={begin}
          className="w-full rounded-full bg-indigo-500 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-600"
        >
          알겠어요, 출발!
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative flex select-none flex-col items-center gap-4 text-center ${shakeClass(fx)}`}
      style={{ touchAction: "manipulation" }}
    >
      <FxOverlay fx={fx} />
      <p className="text-xs text-slate-400">
        {Math.min(index + 1, TRIALS)} / {TRIALS}
      </p>

      {/* 터치하는 곳 */}
      <div
        role="button"
        tabIndex={0}
        aria-label="아군이 나오면 터치"
        onPointerDown={touch}
        className="flex h-60 w-full items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/15"
      >
        {phase === "wait" ? (
          <p className="text-sm text-slate-300">우주를 살피는 중...</p>
        ) : phase === "stimulus" ? (
          <EarthGuardStimulus level={visual} isAlly={sequence[index]} size={170} />
        ) : (
          <EarthGuardStimulus level={visual} isAlly={sequence[index]} size={120} />
        )}
      </div>

      <MessageBar tone={lastOk === null ? "info" : lastOk ? "good" : "bad"}>
        {message || "🛸 아군이 나오면 이 칸을 터치해요!"}
      </MessageBar>

      <FxHint fx={fx}>{CUES[visual]} 아군만 터치하고, 적군은 꾹 참아요!</FxHint>
      <p className="text-xs text-slate-400">PC는 스페이스바를 눌러도 돼요.</p>
    </div>
  );
}

function GuideExample({ level, isAlly }: { level: EarthGuardLevel; isAlly: boolean }) {
  return (
    <div className="text-center">
      <EarthGuardStimulus level={level} isAlly={isAlly} size={110} />
      <p className={`mt-1 text-base font-bold ${isAlly ? "text-[#00ff88]" : "text-[#ff6b6b]"}`}>
        {isAlly ? "아군 (터치)" : "적군 (참기)"}
      </p>
    </div>
  );
}
