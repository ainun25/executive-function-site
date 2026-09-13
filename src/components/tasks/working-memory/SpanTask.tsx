"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserUserAgent, getDeviceType, getScreenSize } from "@/lib/deviceInfo";
import { generateSequence, GRID_SIZE, WorkingMemoryConfig } from "@/lib/workingMemoryEngine";
import type { TrialRecord } from "@/types";

type TaskPhase = "showing" | "recall";

interface SpanTaskProps {
  config: WorkingMemoryConfig;
  onComplete: (trials: TrialRecord[]) => void;
}

/**
 * 작업기억(시각적 순서 기억) 문항을 실제로 진행하는 컴포넌트입니다.
 * 3x3 격자 중 일부 칸이 순서대로 반짝인 뒤, 학생이 같은 순서로 칸을 눌러 재현합니다.
 * span(기억할 칸의 개수)은 2개부터 시작해 정답을 맞출 때마다 1씩 늘어나고,
 * 같은 길이에서 정해진 횟수만큼 계속 틀리면 검사가 종료됩니다 (섹션 10).
 */
export default function SpanTask({ config, onComplete }: SpanTaskProps) {
  const [span, setSpan] = useState(config.startSpan);
  const [attempt, setAttempt] = useState(0); // 같은 span에서 몇 번째 시도인지 (0부터 시작)
  const [phase, setPhase] = useState<TaskPhase>("showing");
  const [highlightedCell, setHighlightedCell] = useState<number | null>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);

  const sequenceRef = useRef<number[]>([]);
  const trialsRef = useRef<TrialRecord[]>([]);
  const recallStartRef = useRef<number | null>(null);
  const tabHiddenRef = useRef(false);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const trialStartedAtRef = useRef<number>(Date.now());

  const clearPendingTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) tabHiddenRef.current = true;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // span 또는 attempt가 바뀔 때마다 새 문항을 시작합니다.
  useEffect(() => {
    clearPendingTimeouts();
    trialStartedAtRef.current = Date.now();
    const sequence = generateSequence(span);
    sequenceRef.current = sequence;
    setUserSequence([]);
    setPhase("showing");
    setHighlightedCell(null);

    let stepIndex = 0;
    const runStep = () => {
      if (stepIndex >= sequence.length) {
        setHighlightedCell(null);
        setPhase("recall");
        recallStartRef.current = performance.now();
        return;
      }
      setHighlightedCell(sequence[stepIndex]);
      const onTimeoutId = setTimeout(() => {
        setHighlightedCell(null);
        const gapTimeoutId = setTimeout(() => {
          stepIndex += 1;
          runStep();
        }, config.itemGapMs);
        timeoutIdsRef.current.push(gapTimeoutId);
      }, config.itemDisplayMs);
      timeoutIdsRef.current.push(onTimeoutId);
    };
    runStep();

    return () => clearPendingTimeouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [span, attempt]);

  const finalizeTrial = useCallback(
    (finalUserSequence: number[]) => {
      const correctSequence = sequenceRef.current;
      const isCorrect =
        finalUserSequence.length === correctSequence.length &&
        finalUserSequence.every((value, idx) => value === correctSequence[idx]);
      const reactionTime =
        recallStartRef.current !== null ? Math.round(performance.now() - recallStartRef.current) : null;

      const record: TrialRecord = {
        trialNumber: trialsRef.current.length + 1,
        taskType: "workingMemory",
        stimulus: correctSequence.join("-"),
        condition: `span-${span}`,
        correctAnswer: correctSequence.join("-"),
        userAnswer: finalUserSequence.join("-"),
        isCorrect,
        reactionTime,
        isOmission: false,
        isCommissionError: false,
        timestamp: trialStartedAtRef.current,
        validTrial: !tabHiddenRef.current,
        invalidReason: tabHiddenRef.current ? "tabHidden" : null,
        deviceType: getDeviceType(),
        browser: getBrowserUserAgent(),
        screenWidth: getScreenSize().width,
        screenHeight: getScreenSize().height,
      };

      trialsRef.current = [...trialsRef.current, record];
      tabHiddenRef.current = false;

      if (isCorrect) {
        if (span + 1 > config.maxSpan) {
          onComplete(trialsRef.current);
        } else {
          setSpan((prev) => prev + 1);
          setAttempt(0);
        }
      } else if (attempt + 1 >= config.maxAttemptsPerSpan) {
        onComplete(trialsRef.current);
      } else {
        setAttempt((prev) => prev + 1);
      }
    },
    [span, attempt, config.maxSpan, config.maxAttemptsPerSpan, onComplete]
  );

  const handleCellClick = useCallback(
    (cellIndex: number) => {
      if (phase !== "recall") return;
      if (userSequence.length >= sequenceRef.current.length) return;

      const nextSequence = [...userSequence, cellIndex];
      setUserSequence(nextSequence);

      if (nextSequence.length === sequenceRef.current.length) {
        finalizeTrial(nextSequence);
      }
    },
    [phase, userSequence, finalizeTrial]
  );

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-xs font-medium text-slate-400">기억할 칸 수: {span}개</p>

      <p className="text-sm text-slate-500">
        {phase === "showing" ? "잘 보고 순서를 기억하세요" : "방금 본 순서대로 눌러보세요"}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: GRID_SIZE }, (_, cellIndex) => {
          const isHighlighted = highlightedCell === cellIndex;
          const clickedOrder = userSequence.indexOf(cellIndex);
          const isClicked = clickedOrder !== -1;
          return (
            <button
              key={cellIndex}
              type="button"
              disabled={phase !== "recall"}
              onClick={() => handleCellClick(cellIndex)}
              className={`flex h-20 w-20 items-center justify-center rounded-2xl text-lg font-bold ring-1 ring-slate-200 transition-colors sm:h-24 sm:w-24 ${
                isHighlighted
                  ? "bg-indigo-500 text-white"
                  : isClicked
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-50 text-slate-300"
              }`}
            >
              {isClicked ? clickedOrder + 1 : cellIndex + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
