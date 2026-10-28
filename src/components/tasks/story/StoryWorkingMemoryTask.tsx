"use client";

import { useRef, useState } from "react";
import SpanTask from "@/components/tasks/working-memory/SpanTask";
import StoryCapacityTask from "./StoryCapacityTask";
import type { WorkingMemoryConfig } from "@/lib/workingMemoryEngine";
import type { TrialRecord } from "@/types";

interface StoryWorkingMemoryTaskProps {
  mode: "practice" | "main";
  config: WorkingMemoryConfig;
  onComplete: (trials: TrialRecord[]) => void;
}

type Stage = "capacity" | "interlude" | "sequence";

/**
 * 스토리형 작업기억 2부: 2-A 보급품 확인(한꺼번에 기억하는 용량) → 2-B 신호 기억(순서 기억).
 * 두 활동의 문항 기록을 이어 붙여(번호를 새로 매겨) 한 번의 검사 결과로 돌려줍니다.
 */
export default function StoryWorkingMemoryTask({ mode, config, onComplete }: StoryWorkingMemoryTaskProps) {
  const [stage, setStage] = useState<Stage>("capacity");
  const capacityTrialsRef = useRef<TrialRecord[]>([]);

  if (stage === "capacity") {
    return (
      <StoryCapacityTask
        mode={mode}
        onComplete={(trials) => {
          capacityTrialsRef.current = trials;
          setStage("interlude");
        }}
      />
    );
  }

  if (stage === "interlude") {
    return (
      <div className="space-y-5 text-center text-white">
        <p className="text-sm font-semibold text-[#a2ffcf]">2-A 보급품 확인 끝!</p>
        <h2 className="text-2xl font-extrabold text-[#00ff88]">이제 2-B 신호 기억</h2>
        <p className="leading-relaxed text-slate-200">
          이번에는 기지가 하나씩 차례로 반짝여요.
          <br />
          <strong className="text-white">반짝인 순서 그대로</strong> 기지를 눌러 신호를 보내세요!
        </p>
        <button
          type="button"
          onClick={() => setStage("sequence")}
          className="rounded-full bg-indigo-500 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-600"
        >
          신호 받기
        </button>
      </div>
    );
  }

  return (
    <SpanTask
      theme="story"
      config={config}
      onComplete={(spanTrials) => {
        const all = [...capacityTrialsRef.current, ...spanTrials].map((trial, i) => ({
          ...trial,
          trialNumber: i + 1,
        }));
        onComplete(all);
      }}
    />
  );
}
