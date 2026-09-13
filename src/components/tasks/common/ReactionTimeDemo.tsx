"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DemoStatus = "idle" | "waiting" | "go" | "tooSoon" | "done";

/**
 * 반응시간 측정 모듈(performance.now + requestAnimationFrame)이 실제로
 * 동작하는 것을 보여주는 작은 연습 데모입니다.
 * 각 검사의 실제 문항(자극)은 PHASE 3~5에서 이 모듈을 이용해 만들어집니다.
 */
export default function ReactionTimeDemo() {
  const [status, setStatus] = useState<DemoStatus>("idle");
  const [lastResult, setLastResult] = useState<number | null>(null);
  const onsetTimeRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const clearPendingTimers = useCallback(() => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
  }, []);

  useEffect(() => clearPendingTimers, [clearPendingTimers]);

  const startWaiting = useCallback(() => {
    clearPendingTimers();
    setLastResult(null);
    setStatus("waiting");
    onsetTimeRef.current = null;

    const delay = 1000 + Math.random() * 2000; // 1~3초 사이 무작위 대기
    timeoutIdRef.current = setTimeout(() => {
      rafIdRef.current = requestAnimationFrame(() => {
        onsetTimeRef.current = performance.now();
        setStatus("go");
      });
    }, delay);
  }, [clearPendingTimers]);

  const handleClick = useCallback(() => {
    if (status === "idle" || status === "done" || status === "tooSoon") {
      startWaiting();
      return;
    }
    if (status === "waiting") {
      clearPendingTimers();
      setStatus("tooSoon");
      return;
    }
    if (status === "go" && onsetTimeRef.current !== null) {
      const rt = performance.now() - onsetTimeRef.current;
      setLastResult(rt);
      setStatus("done");
    }
  }, [status, startWaiting, clearPendingTimers]);

  const boxLabel: Record<DemoStatus, string> = {
    idle: "눌러서 시작하기",
    waiting: "기다리세요...",
    go: "지금 눌러요!",
    tooSoon: "너무 빨랐어요! 다시 눌러보세요",
    done: `반응시간: ${lastResult?.toFixed(0)}ms — 다시 해보려면 눌러보세요`,
  };

  const boxColor: Record<DemoStatus, string> = {
    idle: "bg-slate-100 text-slate-600",
    waiting: "bg-slate-200 text-slate-500",
    go: "bg-teal-500 text-white",
    tooSoon: "bg-rose-100 text-rose-600",
    done: "bg-teal-50 text-teal-700",
  };

  return (
    <div className="text-center">
      <p className="mb-3 text-sm text-slate-500">
        아래 상자가 초록색(teal)으로 바뀌는 순간 최대한 빠르게 눌러보세요.
      </p>
      <button
        type="button"
        onClick={handleClick}
        className={`h-40 w-full rounded-2xl text-lg font-semibold transition-colors ${boxColor[status]}`}
      >
        {boxLabel[status]}
      </button>
    </div>
  );
}
