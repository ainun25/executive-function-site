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
import { RULE_NAME, STORY_RULE_NAME, RuleCard } from "./RuleCard";

interface FlexibilitySwitchTaskProps {
  config: FlexibilityConfig;
  /** story: 스토리형 검사(지구 수호대 작전)의 어두운 우주 배경용 모양과 문구. 문항 규칙은 같습니다. */
  theme?: "standard" | "story";
  onComplete: (trials: TrialRecord[]) => void;
}

const SHAPE_LABEL: Record<ShapeType, string> = { circle: "원", triangle: "세모" };
const COLOR_LABEL: Record<ColorType, string> = { red: "빨강", blue: "파랑" };
const COLOR_HEX: Record<ColorType, string> = { red: "#f43f5e", blue: "#0ea5e9" };

/**
 * 인지적 유연성(규칙 전환/Task Switching) 문항을 실제로 진행하는 컴포넌트입니다.
 * 색깔 규칙 블록 → 모양 규칙 블록 → 혼합 블록 순서로 진행됩니다.
 * 혼합 블록은 같은 규칙이 한동안 이어지다 바뀌고, 마지막에만 짧게 자주 바뀝니다.
 *
 * 규칙은 시작될 때와 바뀔 때 안내 화면으로 "한 번" 분명히 알려줍니다. 안내가 떠 있는 동안에는 반응시간을 재지 않습니다.
 * 문항이 진행되는 동안에는 규칙 배지나 버튼 글자 같은 단서를 계속 보여주지 않으므로,
 * 학생은 안내받은 규칙을 기억해서 적용해야 합니다(규칙을 바꿔 적용하는 능력을 보기 위함).
 * 색상뿐 아니라 모양과 텍스트 라벨을 함께 보여줘 색맹/색약 학생도 구분할 수 있게 합니다 (섹션 20).
 */
export default function FlexibilitySwitchTask({ config, theme = "standard", onComplete }: FlexibilitySwitchTaskProps) {
  const isStory = theme === "story";
  const names = isStory ? STORY_RULE_NAME : RULE_NAME;

  const sequenceRef = useRef<FlexibilityTrialSpec[]>([]);
  if (sequenceRef.current.length === 0) {
    sequenceRef.current = generateTrialSequence(config);
  }

  const [trialIndex, setTrialIndex] = useState(0);
  const [isStimulusVisible, setIsStimulusVisible] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
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

  // 자극을 보여주고 응답을 기다립니다. (반응시간은 이 시점부터 잽니다)
  const startTrial = useCallback(() => {
    setAnnouncing(false);
    timer.reset();
    setIsStimulusVisible(true);
    timer.armStimulus();

    const stimulusTimeoutId = setTimeout(() => {
      if (!timer.hasResponded()) {
        finalizeTrial(null, null);
      }
    }, config.stimulusDurationMs);
    timeoutIdsRef.current.push(stimulusTimeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalizeTrial, config.stimulusDurationMs]);

  // 문항이 바뀔 때: 규칙 안내가 필요하면 먼저 안내하고, 아니면 바로 자극을 보여줍니다.
  useEffect(() => {
    timer.reset();
    if (sequenceRef.current[trialIndex].announce) {
      setIsStimulusVisible(false);
      setAnnouncing(true); // "알겠어요"를 누르면 startTrial
    } else {
      startTrial();
    }
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
      if (announcing) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          startTrial();
        }
        return;
      }
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
  }, [handleResponse, announcing, startTrial]);

  const spec = sequenceRef.current[trialIndex];
  const totalTrials = sequenceRef.current.length;
  const isFirstTrial = trialIndex === 0;
  const isChange = !isFirstTrial && sequenceRef.current[trialIndex - 1].rule !== spec.rule;

  if (announcing) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
        <p className={`text-sm font-bold ${isStory ? "text-[#a2ffcf]" : "text-indigo-600"}`}>
          {isFirstTrial ? "첫 번째 규칙이에요" : isChange ? "🔄 규칙이 바뀌었어요!" : "이 규칙으로 계속해요"}
        </p>
        <div className="w-full">
          <RuleCard rule={spec.rule} title={names[spec.rule]} dark={isStory} />
        </div>
        <p className={`text-xs ${isStory ? "text-slate-300" : "text-slate-500"}`}>
          {isStory
            ? "신호가 나오면 이 암호로 나눠서 알맞은 기지 버튼을 누르세요."
            : "자극이 나오면 이 규칙으로 알맞은 버튼을 누르세요."}
        </p>
        <button
          type="button"
          onClick={startTrial}
          className="w-full rounded-full bg-indigo-500 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-600"
        >
          알겠어요
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-xs font-medium text-slate-400">
        {trialIndex + 1} / {totalTrials}
      </p>

      <div
        className={`flex h-56 w-56 items-center justify-center rounded-3xl ${
          isStory ? "bg-white/10 ring-1 ring-white/20" : "bg-slate-50"
        }`}
      >
        {isStimulusVisible && <ShapeGraphic shape={spec.stimulus.shape} color={spec.stimulus.color} dark={isStory} />}
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleResponse("left")}
          className="rounded-full bg-indigo-500 px-4 py-4 text-lg font-bold text-white hover:bg-indigo-600"
        >
          ← 왼쪽
        </button>
        <button
          type="button"
          onClick={() => handleResponse("right")}
          className="rounded-full bg-indigo-500 px-4 py-4 text-lg font-bold text-white hover:bg-indigo-600"
        >
          오른쪽 →
        </button>
      </div>
    </div>
  );
}

function ShapeGraphic({ shape, color, dark }: { shape: ShapeType; color: ColorType; dark?: boolean }) {
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
      <span className={`text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-500"}`}>{label}</span>
    </div>
  );
}
