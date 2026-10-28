"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserUserAgent, getDeviceType, getScreenSize } from "@/lib/deviceInfo";
import { useTrialTimer } from "@/lib/reactionTimer";
import { capacityShowMs, generateCapacityPlan, type CapacityPlanItem } from "@/lib/storyCapacity";
import type { TrialRecord } from "@/types";
import { StoryProgress } from "./StoryParts";

interface StoryCapacityTaskProps {
  mode: "practice" | "main";
  onComplete: (trials: TrialRecord[]) => void;
}

type Step = "show" | "choose" | "between";

/**
 * 2-A "보급품 확인": 물건/숫자 여러 개가 한꺼번에 보였다가 사라지면, 아래 후보에서 본 것을 모두 고릅니다.
 * 고른 개수가 보여준 개수와 같아지면 그 문항의 응답이 끝납니다. 정답 여부는 알려주지 않습니다.
 * 응답시간은 후보가 화면에 나타난 시점부터 마지막 선택까지(performance.now)입니다.
 */
export default function StoryCapacityTask({ mode, onComplete }: StoryCapacityTaskProps) {
  const [plan] = useState<CapacityPlanItem[]>(() => generateCapacityPlan(mode));
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("show");
  const [selected, setSelected] = useState<string[]>([]);

  const timer = useTrialTimer();
  const trialsRef = useRef<TrialRecord[]>([]);
  const tabHiddenRef = useRef(false);
  const trialStartedAtRef = useRef(Date.now());
  const doneRef = useRef(false);

  const item = plan[index];

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) tabHiddenRef.current = true;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // 문항이 바뀔 때마다 물건을 보여주고, 정해진 시간이 지나면 후보를 보여줍니다.
  useEffect(() => {
    if (!item) return;
    trialStartedAtRef.current = Date.now();
    setSelected([]);
    setStep("show");
    const id = setTimeout(() => {
      setStep("choose");
      timer.armStimulus();
    }, capacityShowMs(item.size));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const finalize = (chosen: string[]) => {
    if (doneRef.current) return;
    const reactionTime = timer.recordResponse();
    const isCorrect = chosen.length === item.shown.length && item.shown.every((s) => chosen.includes(s));
    const hidden = tabHiddenRef.current;

    trialsRef.current = [
      ...trialsRef.current,
      {
        trialNumber: trialsRef.current.length + 1,
        taskType: "workingMemory",
        stimulus: item.shown.join("|"),
        condition: `cap-${item.size}:${item.kind}`,
        correctAnswer: item.shown.join("|"),
        userAnswer: chosen.join("|"),
        isCorrect,
        reactionTime: reactionTime !== null ? Math.round(reactionTime) : null,
        isOmission: false,
        isCommissionError: false,
        timestamp: trialStartedAtRef.current,
        validTrial: !hidden,
        invalidReason: hidden ? "tabHidden" : null,
        deviceType: getDeviceType(),
        browser: getBrowserUserAgent(),
        screenWidth: getScreenSize().width,
        screenHeight: getScreenSize().height,
      },
    ];
    tabHiddenRef.current = false;
    timer.reset();

    if (index + 1 >= plan.length) {
      doneRef.current = true;
      onComplete(trialsRef.current);
      return;
    }
    setStep("between");
    setTimeout(() => setIndex((prev) => prev + 1), 700);
  };

  const toggle = (option: string) => {
    if (step !== "choose") return;
    if (selected.includes(option)) {
      setSelected(selected.filter((s) => s !== option));
      return;
    }
    if (selected.length >= item.size) return;
    const next = [...selected, option];
    setSelected(next);
    if (next.length === item.size) finalize(next);
  };

  if (!item) return null;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <StoryProgress current={Math.min(index + 1, plan.length)} total={plan.length} />

      {step === "show" && (
        <>
          <p className="text-sm text-slate-200">📦 보급 상자가 열렸어요! 한꺼번에 잘 보고 기억하세요</p>
          <div className="flex flex-wrap justify-center gap-3">
            {item.shown.map((value) => (
              <div
                key={value}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-4xl font-bold text-white ring-1 ring-white/30 sm:h-24 sm:w-24"
              >
                {value}
              </div>
            ))}
          </div>
        </>
      )}

      {step === "choose" && (
        <>
          <p className="text-sm text-slate-200">
            🧰 창고에서 방금 본 것을 <strong className="text-white">{item.size}개</strong> 골라 담으세요
          </p>
          <div className="flex max-w-sm flex-wrap justify-center gap-3">
            {item.options.map((value) => {
              const isSelected = selected.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle(value)}
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold transition-colors sm:h-20 sm:w-20 ${
                    isSelected
                      ? "bg-indigo-400/40 text-white ring-2 ring-indigo-300"
                      : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">
            담은 개수 {selected.length} / {item.size}
          </p>
        </>
      )}

      {step === "between" && <p className="py-16 text-sm text-slate-300">📡 다음 보급 상자 준비 중...</p>}
    </div>
  );
}
