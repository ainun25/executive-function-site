"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EarthGuardStimulus from "@/components/play/EarthGuardStimulus";
import { getBrowserUserAgent, getDeviceType, getScreenSize } from "@/lib/deviceInfo";
import {
  generateTrialSequence,
  type InhibitionCondition,
  type InhibitionConfig,
} from "@/lib/inhibitionEngine";
import { useTrialTimer } from "@/lib/reactionTimer";
import { STORY_STAGES, makeStimulusLabel, splitTrialCounts, type StoryStage } from "@/lib/storyInhibition";
import type { TrialRecord } from "@/types";
import { CommanderSay, StoryProgress, StoryScene } from "./StoryParts";

// 단계 사이의 장면 (인덱스 = 다음에 시작할 단계). 정답 여부와 무관한 이야기만 담습니다.
const CUTSCENES: { emoji: string; text: string }[] = [
  { emoji: "🌍", text: "" },
  { emoji: "🌌", text: "행성 구역 순찰이 끝났다. 그런데 레이더에 수상한 불빛이 깜빡인다… UFO 편대가 다가오고 있다!" },
  { emoji: "🛸", text: "UFO 구역 순찰도 끝났다. 이제 마지막이다. 요원들 사이에 변장한 적이 숨어 있다는 제보가 들어왔다…" },
];

type Phase = "fixation" | "stimulus" | "gap";

interface StoryInhibitionTaskProps {
  config: InhibitionConfig;
  /** practice: 1단계(행성)만 / main: 3단계 전체 */
  mode: "practice" | "main";
  onComplete: (trials: TrialRecord[]) => void;
}

interface StagePlan {
  stage: StoryStage;
  conditions: InhibitionCondition[];
}

/**
 * 스토리형 억제통제 검사("지구 수호대 작전 1부: 요원 선별")의 문항 진행 컴포넌트입니다.
 *
 * 표준형(GoNoGoTask)과 같은 측정 규칙을 따릅니다.
 *  - 정답/오답을 알려주지 않습니다 (검사이므로). 반응했다는 사실만 "신호 보냄"으로 보여줍니다.
 *  - 자극이 나타나기 전의 입력은 무시하고, 한 문항에서는 첫 반응만 인정합니다.
 *  - 키를 누르고 있을 때의 반복 입력(event.repeat)은 무시합니다.
 *  - 탭이 비활성화된 상태에서 진행된 문항은 invalid로 표시합니다.
 * 문항 수/속도는 표준형과 같은 설정(연령군별 설정)을 쓰고, 전체 문항을 3단계로 나눠 진행합니다.
 * (표준형 컴포넌트와 일부 로직이 겹치는 건, 표준형을 건드리지 않고 안전하게 분리하기 위해서입니다.)
 */
export default function StoryInhibitionTask({ config, mode, onComplete }: StoryInhibitionTaskProps) {
  const planRef = useRef<StagePlan[] | null>(null);
  if (planRef.current === null) {
    const sequence = generateTrialSequence(config);
    if (mode === "practice") {
      planRef.current = [{ stage: STORY_STAGES[0], conditions: sequence }];
    } else {
      const counts = splitTrialCounts(sequence.length, STORY_STAGES.length);
      let cursor = 0;
      planRef.current = STORY_STAGES.map((stage, index) => {
        const conditions = sequence.slice(cursor, cursor + counts[index]);
        cursor += counts[index];
        return { stage, conditions };
      });
    }
  }
  const plan = planRef.current;
  const totalTrials = plan.reduce((sum, item) => sum + item.conditions.length, 0);

  const [screen, setScreen] = useState<"cutscene" | "guide" | "trials">("guide");
  const [stageIndex, setStageIndex] = useState(0);
  const [trialInStage, setTrialInStage] = useState(1);
  const [phase, setPhase] = useState<Phase>("fixation");
  const [condition, setCondition] = useState<InhibitionCondition>("go");
  const [showSent, setShowSent] = useState(false);

  const timer = useTrialTimer();
  const phaseRef = useRef<Phase>("fixation");
  const stageIndexRef = useRef(0);
  const trialInStageRef = useRef(1);
  const conditionRef = useRef<InhibitionCondition>("go");
  const trialsRef = useRef<TrialRecord[]>([]);
  const tabHiddenRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const schedule = useCallback((callback: () => void, delay: number) => {
    timeoutIdsRef.current.push(window.setTimeout(callback, delay));
  }, []);

  const clearScheduled = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  useEffect(() => clearScheduled, [clearScheduled]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) tabHiddenRef.current = true;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const changePhase = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const finalizeTrial = (userAnswer: "respond" | null, reactionTime: number | null) => {
    const stageIdx = stageIndexRef.current;
    const trialNumber = trialInStageRef.current;
    const stage = plan[stageIdx].stage;
    const cond = conditionRef.current;
    const responded = userAnswer === "respond";
    const isCorrect = cond === "go" ? responded : !responded;

    const record: TrialRecord = {
      trialNumber: trialsRef.current.length + 1,
      taskType: "inhibition",
      stimulus: makeStimulusLabel(stage.id, cond === "go"),
      condition: cond,
      correctAnswer: cond === "go" ? "respond" : "noResponse",
      userAnswer,
      isCorrect,
      reactionTime,
      isOmission: cond === "go" && !responded,
      isCommissionError: cond === "noGo" && responded,
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

    const isLastInStage = trialNumber >= plan[stageIdx].conditions.length;
    const isLastStage = stageIdx + 1 >= plan.length;

    if (isLastInStage && isLastStage) {
      clearScheduled();
      onCompleteRef.current(trialsRef.current);
      return;
    }

    changePhase("gap");
    if (responded) setShowSent(true); // 정답 여부가 아니라 "반응했다"는 사실만 보여줍니다
    schedule(() => {
      if (!isLastInStage) {
        runTrial(stageIdx, trialNumber + 1);
      } else {
        stageIndexRef.current = stageIdx + 1;
        setStageIndex(stageIdx + 1);
        setScreen("cutscene");
      }
    }, config.interTrialGapMs);
  };

  const runTrial = (stageIdx: number, trialNumber: number) => {
    stageIndexRef.current = stageIdx;
    trialInStageRef.current = trialNumber;
    setTrialInStage(trialNumber);
    setShowSent(false);
    timer.reset();
    changePhase("fixation");

    schedule(() => {
      const cond = plan[stageIdx].conditions[trialNumber - 1];
      conditionRef.current = cond;
      setCondition(cond);
      changePhase("stimulus");
      timer.armStimulus();

      schedule(() => {
        if (phaseRef.current === "stimulus" && !timer.hasResponded()) finalizeTrial(null, null);
      }, config.stimulusDurationMs);
    }, config.fixationMs);
  };

  const handleResponse = () => {
    if (phaseRef.current !== "stimulus") return; // 자극이 나타나기 전/후의 입력은 무시
    const reactionTime = timer.recordResponse();
    if (reactionTime === null) return; // 이미 응답했거나 아직 자극이 그려지지 않음
    clearScheduled();
    finalizeTrial("respond", Math.round(reactionTime));
  };

  const handleResponseRef = useRef(handleResponse);
  handleResponseRef.current = handleResponse;
  useEffect(() => {
    if (screen !== "trials") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        handleResponseRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen]);

  const startStage = () => {
    setScreen("trials");
    runTrial(stageIndex, 1);
  };

  const currentStage = plan[stageIndex].stage;
  const completedBefore = plan.slice(0, stageIndex).reduce((sum, item) => sum + item.conditions.length, 0);
  const overallNumber = completedBefore + trialInStage;

  return (
    <div
      className="flex min-h-[70vh] w-full select-none flex-col items-center justify-center text-center text-white"
      style={{ touchAction: "manipulation" }}
      onPointerDown={screen === "trials" ? handleResponse : undefined}
    >
      {screen === "cutscene" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-5 px-2">
          <StoryScene emoji={CUTSCENES[stageIndex]?.emoji ?? "🌌"}>{CUTSCENES[stageIndex]?.text}</StoryScene>
          <button
            type="button"
            onClick={() => setScreen("guide")}
            className="w-full rounded-full bg-indigo-500 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-600"
          >
            다음 장면
          </button>
        </div>
      )}

      {screen === "guide" && (
        <div className="flex w-full flex-col items-center px-2">
          <h2 className="text-2xl font-extrabold text-[#ffcc00]">
            {mode === "practice" ? "연습 단계" : currentStage.title}
          </h2>
          <div className="mt-3 w-full">
            <CommanderSay>{mode === "practice" ? "요원, 작전 준비 훈련부터 시작하겠네!" : currentStage.story}</CommanderSay>
          </div>
          <div className="my-4 flex w-full justify-evenly">
            <GuideExample stage={currentStage} isAlly />
            <GuideExample stage={currentStage} isAlly={false} />
          </div>
          <p className="rounded-xl border border-[#00ff88]/50 bg-white/10 px-4 py-3 text-sm leading-relaxed">
            {currentStage.cue}
            <br />
            <strong>아군이 나오면 빠르게 터치! 적군이 나오면 꾹 참기!</strong>
          </p>
          <button
            type="button"
            onClick={startStage}
            className="mt-6 w-full max-w-xs rounded-full bg-indigo-500 px-6 py-4 text-lg font-bold text-white shadow-[0_5px_0_#312e81] transition active:translate-y-[3px] active:shadow-[0_2px_0_#312e81]"
          >
            미션 시작!
          </button>
        </div>
      )}

      {screen === "trials" && (
        <div className="flex w-full flex-col items-center">
          <StoryProgress current={overallNumber} total={totalTrials} />
          <div className="my-6 flex h-52 w-full items-center justify-center">
            {phase === "stimulus" && (
              <EarthGuardStimulus level={currentStage.visual} isAlly={condition === "go"} />
            )}
          </div>
          <p className="h-8 text-xl font-bold text-slate-300" aria-live="polite">
            {showSent ? "📡 신호 보냄!" : ""}
          </p>
          <p className="mt-6 text-xs text-slate-500">화면 아무 곳이나 터치 (PC는 스페이스바)</p>
        </div>
      )}
    </div>
  );
}

function GuideExample({ stage, isAlly }: { stage: StoryStage; isAlly: boolean }) {
  return (
    <div className="text-center">
      <EarthGuardStimulus level={stage.visual} isAlly={isAlly} size={128} />
      <p className={`mt-1 text-lg font-bold ${isAlly ? "text-[#00ff88]" : "text-[#ff6b6b]"}`}>
        {isAlly ? "아군" : "적군"}
        <br />
        <span className="text-base">{isAlly ? "(터치)" : "(참기)"}</span>
      </p>
    </div>
  );
}
