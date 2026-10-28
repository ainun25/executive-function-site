"use client";

import { CommanderSay } from "@/components/tasks/story/StoryParts";
import { useState } from "react";
import Link from "next/link";
import TestSessionShell from "@/components/tasks/common/TestSessionShell";
import DeviceRecommendationNotice from "@/components/tasks/common/DeviceRecommendationNotice";
import ParticipantGate from "@/components/tasks/common/ParticipantGate";
import StoryInhibitionTask from "@/components/tasks/story/StoryInhibitionTask";
import StoryInhibitionReport from "@/components/results/StoryInhibitionReport";
import type { InhibitionConfig } from "@/lib/inhibitionEngine";
import { analyzeInhibitionTrials } from "@/lib/inhibitionAnalysis";
import { saveTestResult } from "@/lib/resultStorage";
import { toPracticeConfig } from "@/lib/testConfig";
import { useTestConfig } from "@/lib/useTestConfig";
import type { ParticipantInfo, TestPhase, TrialRecord } from "@/types";

const SPACE_BACKGROUND = "bg-gradient-to-b from-[#1a1f3c] to-[#050a18]";
const primaryButton =
  "w-full rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-600";

export default function StoryInhibitionTestPage() {
  return <ParticipantGate>{(participant) => <StoryInhibitionFlow participant={participant} />}</ParticipantGate>;
}

// 이름/나이/학년 입력이 끝나 연령군이 정해진 뒤, 그 연령군의 설정(표준형과 같은 설정)을 불러와 진행합니다.
function StoryInhibitionFlow({ participant }: { participant: ParticipantInfo }) {
  const [practiceTrials, setPracticeTrials] = useState<TrialRecord[]>([]);
  const [mainTrials, setMainTrials] = useState<TrialRecord[]>([]);
  const { config, isReady } = useTestConfig<InhibitionConfig>("inhibition", participant.ageGroup);

  if (!isReady) {
    return <p className="py-20 text-center text-slate-400">불러오는 중...</p>;
  }

  return (
    <TestSessionShell
      title="지구 수호대 작전 1부: 요원 선별"
      focusedBackgroundClass={SPACE_BACKGROUND}
      renderPhase={(phase, goToNext) => (
        <PhaseContent
          phase={phase}
          goToNext={goToNext}
          config={config}
          participant={participant}
          practiceTrials={practiceTrials}
          setPracticeTrials={setPracticeTrials}
          mainTrials={mainTrials}
          setMainTrials={setMainTrials}
        />
      )}
    />
  );
}

interface PhaseContentProps {
  phase: TestPhase;
  goToNext: () => void;
  config: InhibitionConfig;
  participant: ParticipantInfo;
  practiceTrials: TrialRecord[];
  setPracticeTrials: (trials: TrialRecord[]) => void;
  mainTrials: TrialRecord[];
  setMainTrials: (trials: TrialRecord[]) => void;
}

function PhaseContent({
  phase,
  goToNext,
  config,
  participant,
  practiceTrials,
  setPracticeTrials,
  mainTrials,
  setMainTrials,
}: PhaseContentProps) {
  const practiceConfig = toPracticeConfig("inhibition", config);

  switch (phase) {
    case "intro":
      return (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-b from-[#1a1f3c] to-[#050a18] p-6 text-white">
            <p className="text-sm font-semibold text-[#a2ffcf]">지구 수호대 작전 · 1부</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#00ff88]">요원 선별</h2>
            <div className="mt-4">
              <CommanderSay>요원 후보, 잘 왔네! 지구를 지킬 요원을 뽑는 선별 임무를 시작하겠네.</CommanderSay>
            </div>
            <p className="mt-3 leading-relaxed text-slate-200">
              멋진 요원이 되려면 미션을 해내야 해요! 행성, UFO, 변장한 요원이 하나씩 나타나요.
              <br />
              <strong className="text-white">아군이 나오면 빠르게 터치! 적군이 나오면 꾹 참기!</strong>
              <br />
              본 미션 중에는 정답을 알려주지 않아요.
            </p>
          </div>
          <DeviceRecommendationNotice />
          <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
            본 검사는 실행기능의 일부 특성을 살펴보기 위한 교육·연구용 수행과제이며, 의학적 또는 심리학적
            진단을 목적으로 하지 않습니다.
          </div>
          <button type="button" onClick={goToNext} className={primaryButton}>
            연습 시작하기
          </button>
        </div>
      );

    case "practice":
      return (
        <StoryInhibitionTask
          mode="practice"
          config={practiceConfig}
          onComplete={(trials) => {
            setPracticeTrials(trials);
            goToNext();
          }}
        />
      );

    case "practiceResult": {
      const analysis = analyzeInhibitionTrials(practiceTrials, practiceConfig.anticipatoryThresholdMs);
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">연습 결과 확인</h2>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-5 text-center">
            <PracticeStat label="아군에게 인사" value={`${analysis.goAccuracy}%`} />
            <PracticeStat label="적군 참기" value={`${analysis.noGoAccuracy}%`} />
          </div>
          <p className="text-sm text-slate-500">
            연습에서 감을 잡았다면 이제 본 미션을 시작해볼까요? 본 미션에서는 행성, UFO, 요원이 차례로 나와요.
          </p>
          <button type="button" onClick={goToNext} className={primaryButton}>
            준비됐어요
          </button>
        </div>
      );
    }

    case "ready":
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">이제 본 미션을 시작합니다</h2>
          <p className="text-slate-500">본 미션 중에는 정답 여부를 알려주지 않아요. 준비되면 눌러주세요.</p>
          <button type="button" onClick={goToNext} className={primaryButton}>
            본 미션 시작
          </button>
        </div>
      );

    case "main":
      return (
        <StoryInhibitionTask
          mode="main"
          config={config}
          onComplete={(trials) => {
            setMainTrials(trials);
            saveTestResult("inhibition", trials, participant, { ...config }, "story");
            goToNext();
          }}
        />
      );

    case "complete":
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">미션 완료! 🎉</h2>
          <p className="text-slate-500">3단계를 모두 해냈어요. 결과서를 확인해볼까요?</p>
          <button type="button" onClick={goToNext} className={primaryButton}>
            결과서 보기
          </button>
        </div>
      );

    case "result":
      return (
        <div className="space-y-6">
          <StoryInhibitionReport
            trials={mainTrials}
            anticipatoryThresholdMs={config.anticipatoryThresholdMs}
            participant={participant}
          />
          <Link
            href="/tests"
            className="block w-full rounded-full border border-indigo-300 px-6 py-3 text-center text-base font-semibold text-indigo-600 hover:bg-indigo-50 print:hidden"
          >
            검사 목록으로 돌아가기
          </Link>
        </div>
      );

    default:
      return null;
  }
}

function PracticeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
