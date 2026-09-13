"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTrialTimer } from "@/lib/reactionTimer";
import { getBrowserUserAgent, getDeviceType, getScreenSize } from "@/lib/deviceInfo";
import { generateTrialSequence, InhibitionCondition, InhibitionConfig } from "@/lib/inhibitionEngine";
import type { TrialRecord } from "@/types";

type TrialPhase = "fixation" | "stimulus" | "gap";

// GO 자극 = 고양이(누르기), NO-GO 자극 = 호랑이(참기)
const STIMULUS_EMOJI: Record<InhibitionCondition, string> = {
  go: "🐱",
  noGo: "🐯",
};

interface GoNoGoTaskProps {
  config: InhibitionConfig;
  onComplete: (trials: TrialRecord[]) => void;
}

/**
 * 억제통제 Go/No-Go 문항을 실제로 진행하는 컴포넌트입니다.
 * 연습(practiceInhibitionConfig)과 본검사(defaultInhibitionConfig) 모두 이 컴포넌트를 재사용합니다.
 *
 * 데이터 품질 규칙(섹션 23)을 다음과 같이 지킵니다.
 * - 자극이 뜨기 전(fixation 단계)의 입력은 무시합니다.
 * - 한 문항당 최대 한 번의 응답만 인정합니다 (useTrialTimer가 보장).
 * - keydown의 event.repeat를 확인해 키를 누르고 있을 때의 반복 입력을 막습니다.
 * - 탭이 비활성화된 상태에서 진행된 문항은 invalid로 표시합니다.
 */
export default function GoNoGoTask({ config, onComplete }: GoNoGoTaskProps) {
  const sequenceRef = useRef<InhibitionCondition[]>([]);
  if (sequenceRef.current.length === 0) {
    sequenceRef.current = generateTrialSequence(config);
  }

  const [trialIndex, setTrialIndex] = useState(0);
  const [trialPhase, setTrialPhase] = useState<TrialPhase>("fixation");
  const trialsRef = useRef<TrialRecord[]>([]);
  const tabHiddenRef = useRef(false);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const timer = useTrialTimer();

  const clearPendingTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
  }, []);

  // 브라우저 탭이 비활성화되면 현재 문항을 invalid 처리하기 위한 표시만 남깁니다.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) tabHiddenRef.current = true;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const finalizeTrial = useCallback(
    (userAnswer: "respond" | null, reactionTime: number | null) => {
      const condition = sequenceRef.current[trialIndex];
      const correctAnswer = condition === "go" ? "respond" : "noResponse";
      const responded = userAnswer === "respond";

      const isCorrect = condition === "go" ? responded : !responded;
      const isOmission = condition === "go" && !responded;
      const isCommissionError = condition === "noGo" && responded;

      const record: TrialRecord = {
        trialNumber: trialIndex + 1,
        taskType: "inhibition",
        stimulus: STIMULUS_EMOJI[condition],
        condition,
        correctAnswer,
        userAnswer,
        isCorrect,
        reactionTime,
        isOmission,
        isCommissionError,
        timestamp: Date.now(),
        validTrial: !tabHiddenRef.current,
        invalidReason: tabHiddenRef.current ? "tabHidden" : null,
        deviceType: getDeviceType(),
        browser: getBrowserUserAgent(),
        screenWidth: getScreenSize().width,
        screenHeight: getScreenSize().height,
      };

      trialsRef.current = [...trialsRef.current, record];
      tabHiddenRef.current = false;

      if (trialIndex + 1 >= sequenceRef.current.length) {
        clearPendingTimeouts();
        onComplete(trialsRef.current);
        return;
      }

      setTrialPhase("gap");
      const gapTimeoutId = setTimeout(() => {
        setTrialIndex((prev) => prev + 1);
      }, config.interTrialGapMs);
      timeoutIdsRef.current.push(gapTimeoutId);
    },
    [trialIndex, config.interTrialGapMs, clearPendingTimeouts, onComplete]
  );

  // 문항이 바뀔 때마다: fixation("+") 표시 → 자극 표시 → 응답 없으면 자동 종료
  useEffect(() => {
    setTrialPhase("fixation");
    timer.reset();

    const fixationTimeoutId = setTimeout(() => {
      setTrialPhase("stimulus");
      timer.armStimulus();

      const stimulusTimeoutId = setTimeout(() => {
        if (!timer.hasResponded()) {
          finalizeTrial(null, null);
        }
      }, config.stimulusDurationMs);
      timeoutIdsRef.current.push(stimulusTimeoutId);
    }, config.fixationMs);
    timeoutIdsRef.current.push(fixationTimeoutId);

    return () => {
      clearPendingTimeouts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialIndex]);

  const handleResponse = useCallback(() => {
    if (trialPhase !== "stimulus") return; // 자극이 뜨기 전/후의 입력은 무시
    const reactionTime = timer.recordResponse();
    if (reactionTime === null) return; // 이미 응답했거나 아직 자극이 뜨지 않음
    clearPendingTimeouts();
    finalizeTrial("respond", Math.round(reactionTime));
  }, [trialPhase, timer, clearPendingTimeouts, finalizeTrial]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return; // 키를 누르고 있을 때의 반복 입력 방지
      if (event.code === "Space") {
        event.preventDefault();
        handleResponse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleResponse]);

  const condition = sequenceRef.current[trialIndex];
  const totalTrials = sequenceRef.current.length;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-xs font-medium text-slate-400">
        {Math.min(trialIndex + 1, totalTrials)} / {totalTrials}
      </p>

      <div className="flex h-56 w-56 items-center justify-center rounded-3xl bg-slate-50 text-8xl">
        {trialPhase === "stimulus" && STIMULUS_EMOJI[condition]}
        {trialPhase === "fixation" && <span className="text-4xl text-slate-300">+</span>}
      </div>

      <button
        type="button"
        onClick={handleResponse}
        className="w-full max-w-xs rounded-full bg-indigo-500 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-indigo-600"
      >
        누르기 (스페이스바 가능)
      </button>

      <p className="text-xs text-slate-400">
        🐱 고양이가 보이면 누르고, 🐯 호랑이가 보이면 누르지 마세요.
      </p>
    </div>
  );
}
