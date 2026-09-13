"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTrialTimer } from "@/lib/reactionTimer";
import { getBrowserUserAgent, getDeviceType, getScreenSize } from "@/lib/deviceInfo";
import {
  FlexibilityConfig,
  FlexibilityTrialSpec,
  RuleType,
  ShapeType,
  ColorType,
  SideAnswer,
  generateTrialSequence,
  getCorrectAnswer,
} from "@/lib/flexibilityEngine";
import type { TrialRecord } from "@/types";

interface FlexibilitySwitchTaskProps {
  config: FlexibilityConfig;
  onComplete: (trials: TrialRecord[]) => void;
}

const RULE_LABEL: Record<RuleType, string> = { color: "색깔 규칙", shape: "모양 규칙" };
const SHAPE_LABEL: Record<ShapeType, string> = { circle: "원", triangle: "세모" };
const COLOR_LABEL: Record<ColorType, string> = { red: "빨강", blue: "파랑" };
const COLOR_HEX: Record<ColorType, string> = { red: "#f43f5e", blue: "#0ea5e9" };

/**
 * 인지적 유연성(규칙 전환/Task Switching) 문항을 실제로 진행하는 컴포넌트입니다.
 * 색깔 규칙 블록 → 모양 규칙 블록 → 혼합 블록(규칙이 무작위로 바뀜) 순서로 진행되며,
 * 색상뿐 아니라 모양과 텍스트 라벨을 함께 보여줘 색맹/색약 학생도 구분할 수 있게 합니다 (섹션 20).
 */
export default function FlexibilitySwitchTask({ config, onComplete }: FlexibilitySwitchTaskProps) {
  const sequenceRef = useRef<FlexibilityTrialSpec[]>([]);
  if (sequenceRef.current.length === 0) {
    sequenceRef.current = generateTrialSequence(config);
  }

  const [trialIndex, setTrialIndex] = useState(0);
  const [isStimulusVisible, setIsStimulusVisible] = useState(true);
  const trialsRef = useRef<TrialRecord[]>([]);
  const tabHiddenRef = useRef(false);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const previousRuleRef = useRef<RuleType | null>(null);
  const timer = useTrialTimer();

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

  const finalizeTrial = useCallback(
    (userAnswer: SideAnswer | null, reactionTime: number | null) => {
      const spec = sequenceRef.current[trialIndex];
      const correctAnswer = getCorrectAnswer(spec.rule, spec.stimulus);
      const isCorrect = userAnswer === correctAnswer;
      const transition: "repeat" | "switch" =
        previousRuleRef.current === null || previousRuleRef.current === spec.rule
          ? "repeat"
          : "switch";
      previousRuleRef.current = spec.rule;

      const record: TrialRecord = {
        trialNumber: trialIndex + 1,
        taskType: "flexibility",
        stimulus: `${spec.stimulus.color}-${spec.stimulus.shape}`,
        condition: `${spec.block}:${transition}`,
        correctAnswer,
        userAnswer,
        isCorrect,
        reactionTime,
        isOmission: userAnswer === null,
        isCommissionError: false,
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

      setIsStimulusVisible(false);
      const gapTimeoutId = setTimeout(() => {
        setTrialIndex((prev) => prev + 1);
      }, config.interTrialGapMs);
      timeoutIdsRef.current.push(gapTimeoutId);
    },
    [trialIndex, config.interTrialGapMs, clearPendingTimeouts, onComplete]
  );

  useEffect(() => {
    timer.reset();
    setIsStimulusVisible(true);
    timer.armStimulus();

    const stimulusTimeoutId = setTimeout(() => {
      if (!timer.hasResponded()) {
        finalizeTrial(null, null);
      }
    }, config.stimulusDurationMs);
    timeoutIdsRef.current.push(stimulusTimeoutId);

    return () => clearPendingTimeouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialIndex]);

  const handleResponse = useCallback(
    (side: SideAnswer) => {
      const reactionTime = timer.recordResponse();
      if (reactionTime === null) return;
      clearPendingTimeouts();
      finalizeTrial(side, Math.round(reactionTime));
    },
    [timer, clearPendingTimeouts, finalizeTrial]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleResponse("left");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleResponse("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleResponse]);

  const spec = sequenceRef.current[trialIndex];
  const totalTrials = sequenceRef.current.length;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
        지금 규칙: {RULE_LABEL[spec.rule]}
      </div>
      <p className="text-xs font-medium text-slate-400">
        {trialIndex + 1} / {totalTrials}
      </p>

      <div className="flex h-56 w-56 items-center justify-center rounded-3xl bg-slate-50">
        {isStimulusVisible && <ShapeGraphic shape={spec.stimulus.shape} color={spec.stimulus.color} />}
      </div>

      <div className="grid w-full max-w-xs grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleResponse("left")}
          className="rounded-full bg-amber-500 px-6 py-4 text-lg font-bold text-white hover:bg-amber-600"
        >
          ← 왼쪽
        </button>
        <button
          type="button"
          onClick={() => handleResponse("right")}
          className="rounded-full bg-amber-500 px-6 py-4 text-lg font-bold text-white hover:bg-amber-600"
        >
          오른쪽 →
        </button>
      </div>

      <p className="text-xs text-slate-400">
        {spec.rule === "color" ? "빨강 → 왼쪽, 파랑 → 오른쪽" : "원 → 왼쪽, 세모 → 오른쪽"}
      </p>
    </div>
  );
}

function ShapeGraphic({ shape, color }: { shape: ShapeType; color: ColorType }) {
  const hex = COLOR_HEX[color];
  const label = `${COLOR_LABEL[color]} ${SHAPE_LABEL[shape]}`;
  return (
    <div className="flex flex-col items-center gap-3">
      {shape === "circle" ? (
        <div className="h-24 w-24 rounded-full" style={{ backgroundColor: hex }} role="img" aria-label={label} />
      ) : (
        <div
          className="h-0 w-0"
          style={{
            borderLeft: "48px solid transparent",
            borderRight: "48px solid transparent",
            borderBottom: `84px solid ${hex}`,
          }}
          role="img"
          aria-label={label}
        />
      )}
      <span className="text-sm font-semibold text-slate-500">{label}</span>
    </div>
  );
}
