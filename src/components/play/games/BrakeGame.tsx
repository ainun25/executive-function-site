"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameShell";
import { FxHint, FxOverlay, shakeClass, useFx, MessageBar } from "../feedbackFx";

/**
 * 꼬마 자동차 브레이크 (억제통제 놀이).
 * 페달을 꾹 누르고 있으면 달리고(우세한 반응), 멈춤 신호가 나오면 손을 떼서 멈춥니다(반응 억제/멈추기).
 * 계속 신호(초록불 등)에서는 손을 떼지 않고 참아야 합니다.
 * ⚠️ 놀이이므로 정답을 바로 알려줍니다. 결과는 별 개수 외에 저장하지 않습니다.
 */

interface Sign {
  emoji: string;
  label: string;
  stop: boolean; // true면 멈춤 신호(손 떼기), false면 계속 달리는 신호
}

const STOP_SIGNS: Sign[] = [
  { emoji: "🛑", label: "빨간불", stop: true },
  { emoji: "🚧", label: "공사 중", stop: true },
];
const GO_SIGNS: Sign[] = [
  { emoji: "🟢", label: "초록불", stop: false },
  { emoji: "🌳", label: "나무", stop: false },
  { emoji: "🟡", label: "노란불(계속)", stop: false },
];

// 단계별 설정: 신호 개수, 멈춤 신호 비율, 반응 시간(ms), 쓰는 계속 신호
const CONFIG = {
  1: { events: 8, stopRatio: 0.5, windowMs: 2800, goPool: [0] },
  2: { events: 12, stopRatio: 0.5, windowMs: 2000, goPool: [0, 1] },
  3: { events: 16, stopRatio: 0.4, windowMs: 1400, goPool: [0, 1, 2] },
} as const;

type Phase = "ready" | "driving" | "signal" | "feedback";

function makeSigns(level: 1 | 2 | 3): Sign[] {
  const cfg = CONFIG[level];
  const stopCount = Math.round(cfg.events * cfg.stopRatio);
  const signs: Sign[] = [];
  for (let i = 0; i < cfg.events; i++) {
    if (i < stopCount) signs.push(STOP_SIGNS[i % STOP_SIGNS.length]);
    else signs.push(GO_SIGNS[cfg.goPool[(i - stopCount) % cfg.goPool.length]]);
  }
  for (let i = signs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [signs[i], signs[j]] = [signs[j], signs[i]];
  }
  return signs;
}

export default function BrakeGame({ level, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const fx = useFx();
  const [crashed, setCrashed] = useState(false);
  const [signs] = useState<Sign[]>(() => makeSigns(level));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [holding, setHolding] = useState(false);
  const [message, setMessage] = useState("🦶 페달을 꾹 눌러 출발해요!");
  const [lastOk, setLastOk] = useState<boolean | null>(null);

  const phaseRef = useRef<Phase>("ready");
  const holdingRef = useRef(false);
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

  const startDrive = useCallback(() => {
    changePhase("driving");
    setCrashed(false);
    setMessage("달려요~ 🚗💨");
    setLastOk(null);
    // 신호가 나오기 전까지 잠깐 달립니다 (신호가 나오는 시점을 예측하기 어렵게 시간을 조금씩 다르게)
    schedule(showSignal, 900 + Math.random() * 1100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSignal = () => {
    if (phaseRef.current !== "driving") return;
    changePhase("signal");
    setMessage("");
    schedule(onTimeout, cfg.windowMs);
  };

  const finishEvent = (ok: boolean, text: string, crash = false) => {
    clearAll();
    if (ok) correctRef.current += 1;
    if (ok) fx.hit("통과!");
    else fx.miss(crash ? "쿵!" : "앗!", crash);
    setCrashed(crash);
    setLastOk(ok);
    setMessage(text);
    changePhase("feedback");
    schedule(() => {
      const next = indexRef.current + 1;
      if (next >= signs.length) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinish({ correct: correctRef.current, total: signs.length });
        }
        return;
      }
      indexRef.current = next;
      setIndex(next);
      if (holdingRef.current) startDrive();
      else {
        changePhase("ready");
        setMessage("🦶 페달을 꾹 눌러 다시 출발해요!");
      }
    }, 1300);
  };

  const onRelease = () => {
    if (phaseRef.current === "driving") {
      // 신호가 나오기 전에 손을 뗀 경우: 다시 시동
      clearAll();
      changePhase("ready");
      setMessage("🦶 페달을 꾹 누르고 있어야 달려요!");
      return;
    }
    if (phaseRef.current !== "signal") return;
    const sign = signs[indexRef.current];
    if (sign.stop) finishEvent(true, `🛑 통과! 끼익~ ${sign.label}에서 잘 멈췄어요 👍`);
    else finishEvent(false, `앗, 지금은 달려도 돼요! ${sign.label}에서는 손을 떼지 않아도 돼요`);
  };

  const onTimeout = () => {
    if (phaseRef.current !== "signal") return;
    const sign = signs[indexRef.current];
    if (sign.stop) finishEvent(false, `쿵! ${sign.label}에서 멈추지 못했어요. 멈춤 신호가 나오면 손을 떼요!`, true);
    else finishEvent(true, `🟢 통과! ${sign.label}에서 계속 잘 달렸어요 👍`);
  };

  const press = () => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    if (phaseRef.current === "ready") startDrive();
  };
  const release = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    onRelease();
  };

  // 키보드(스페이스바)로도 같은 방식으로 놀 수 있어요.
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      event.preventDefault();
      press();
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sign = signs[index];
  const isDriving = phase === "driving" || phase === "signal";

  return (
    <div
      className={`relative flex select-none flex-col items-center gap-4 text-center ${shakeClass(fx)}`}
      style={{ touchAction: "none" }}
    >
      <FxOverlay fx={fx} />
      <p className="text-xs text-slate-400">
        {Math.min(index + 1, signs.length)} / {signs.length}
      </p>

      {/* 길 */}
      <div className="relative flex h-52 w-full flex-col items-center justify-between overflow-hidden rounded-2xl bg-slate-700 py-3">
        <div className="h-24 text-center">
          {phase === "signal" ? (
            <>
              <p className="text-6xl" aria-hidden="true">
                {sign.emoji}
              </p>
              <p className="mt-1 text-lg font-extrabold text-white">{sign.label}</p>
            </>
          ) : (
            <p className="pt-8 text-sm text-slate-300">{isDriving ? "길을 달리는 중..." : ""}</p>
          )}
        </div>
        <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,#fde68a_0_14px,transparent_14px_28px)] opacity-40" />
        <p className={`relative text-6xl ${isDriving && holding ? "animate-bounce" : ""}`} aria-hidden="true">
          {crashed ? "💥" : "🚗"}
        </p>
      </div>

      <MessageBar tone={lastOk === null ? "info" : lastOk ? "good" : "bad"}>{message}</MessageBar>

      <FxHint fx={fx}>🛑·🚧가 나오면 손 떼기, 🟢·🌳·🟡가 나오면 계속 누르고 있기!</FxHint>

      {/* 페달 */}
      <button
        type="button"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          press();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onContextMenu={(event) => event.preventDefault()}
        className={`w-full max-w-xs rounded-3xl px-6 py-8 text-xl font-extrabold transition-colors ${
          holding ? "bg-[#00ff88] text-[#050a18] shadow-[0_0_24px_#00ff88]" : "bg-indigo-500 text-white"
        }`}
      >
        {holding ? "🦶 달리는 중 (떼면 멈춰요)" : "🦶 페달 꾹 누르기"}
      </button>
      <p className="text-xs text-slate-400">PC는 스페이스바를 꾹 눌러도 돼요.</p>
    </div>
  );
}
