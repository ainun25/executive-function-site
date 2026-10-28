"use client";

import { StoryIntro } from "@/components/tasks/story/StoryParts";
import { useState } from "react";
import Link from "next/link";
import TestSessionShell from "@/components/tasks/common/TestSessionShell";
import DeviceRecommendationNotice from "@/components/tasks/common/DeviceRecommendationNotice";
import ParticipantGate from "@/components/tasks/common/ParticipantGate";
import FlexibilitySwitchTask from "@/components/tasks/flexibility/FlexibilitySwitchTask";
import { RuleGuide } from "@/components/tasks/flexibility/RuleCard";
import StoryFlexibilityReport from "@/components/results/StoryFlexibilityReport";
import type { FlexibilityConfig } from "@/lib/flexibilityEngine";
import { analyzeFlexibilityTrials } from "@/lib/flexibilityAnalysis";
import { saveTestResult } from "@/lib/resultStorage";
import { toPracticeConfig } from "@/lib/testConfig";
import { useTestConfig } from "@/lib/useTestConfig";
import type { ParticipantInfo, TestPhase, TrialRecord } from "@/types";

const SPACE_BACKGROUND = "bg-gradient-to-b from-[#1a1f3c] to-[#050a18]";
const primaryButton =
  "w-full rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-600";

export default function StoryFlexibilityTestPage() {
  return <ParticipantGate>{(participant) => <StoryFlexibilityFlow participant={participant} />}</ParticipantGate>;
}

// 이름/나이/학년 입력이 끝나 연령군이 정해진 뒤, 그 연령군의 설정(표준형과 같은 설정)을 불러와 진행합니다.
function StoryFlexibilityFlow({ participant }: { participant: ParticipantInfo }) {
  const [practiceTrials, setPracticeTrials] = useState<TrialRecord[]>([]);
  const [mainTrials, setMainTrials] = useState<TrialRecord[]>([]);
  const { config, isReady } = useTestConfig<FlexibilityConfig>("flexibility", participant.ageGroup);

  if (!isReady) {
    return <p className="py-20 text-center text-slate-400">불러오는 중...</p>;
  }

  return (
    <TestSessionShell
      title="지구 수호대 작전 3부: 규칙 변경"
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
  config: FlexibilityConfig;
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
  const practiceConfig = toPracticeConfig("flexibility", config);

  switch (phase) {
    case "intro":
      return (
        <div className="space-y-6">
          <StoryIntro
            part="3부"
            title="규칙 변경"
            commander="마지막 임무일세, 요원! 비밀 통신 암호를 해독해야 하네."
            steps={[
              "우주선 신호가 하나씩 나타나면, 지금 암호에 맞게 왼쪽 또는 오른쪽 기지로 보내요.",
              "암호는 색과 모양 두 가지예요. 한동안 이어지다가 바뀌고, 바뀔 때 한 번만 알려줘요.",
              "본 미션 중에는 정답을 알려주지 않아요.",
            ]}
          />
          <div className="rounded-2xl bg-gradient-to-b from-[#1a1f3c] to-[#050a18] p-4">
            <RuleGuide dark story />
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
        <FlexibilitySwitchTask
          theme="story"
          config={practiceConfig}
          onComplete={(trials) => {
            setPracticeTrials(trials);
            goToNext();
          }}
        />
      );

    case "practiceResult": {
      const analysis = analyzeFlexibilityTrials(practiceTrials);
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">연습 결과 확인</h2>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-5 text-center">
            <PracticeStat label="맞게 나눈 비율" value={`${analysis.overallAccuracy}%`} />
            <PracticeStat label="암호 바뀐 직후 속도 차이" value={analysis.switchCostRT !== null ? `${analysis.switchCostRT}ms` : "-"} />
          </div>
          <p className="text-sm text-slate-500">
            암호가 바뀌는 순간에 조금 더 걸리는 건 자연스러운 일이에요. 이제 본 미션을 시작해볼까요? 본 미션에서는 색깔 암호, 모양 암호, 그리고 암호가 수시로 바뀌는 단계가 차례로 나와요.
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
        <FlexibilitySwitchTask
          theme="story"
          config={config}
          onComplete={(trials) => {
            setMainTrials(trials);
            saveTestResult("flexibility", trials, participant, { ...config }, "story");
            goToNext();
          }}
        />
      );

    case "complete":
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">미션 완료! 🎉</h2>
          <p className="text-sm italic text-slate-500">🏅 모든 임무를 마쳤다! 본부에서 임명장을 준비하고 있다.</p>
          <p className="text-slate-500">마지막 미션까지 해냈어요. 결과서를 확인해볼까요?</p>
          <button type="button" onClick={goToNext} className={primaryButton}>
            결과서 보기
          </button>
        </div>
      );

    case "result":
      return (
        <div className="space-y-6">
          <StoryFlexibilityReport trials={mainTrials} participant={participant} />
          <Link
            href="/results/story"
            className="block w-full rounded-full bg-indigo-500 px-6 py-3 text-center text-base font-semibold text-white hover:bg-indigo-600 print:hidden"
          >
            🎖️ 스토리 종합 결과서 · 임명장 보기
          </Link>
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
