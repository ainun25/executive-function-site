"use client";

import { useState } from "react";
import Link from "next/link";
import TestSessionShell from "@/components/tasks/common/TestSessionShell";
import DeviceRecommendationNotice from "@/components/tasks/common/DeviceRecommendationNotice";
import FlexibilitySwitchTask from "@/components/tasks/flexibility/FlexibilitySwitchTask";
import { defaultFlexibilityConfig, practiceFlexibilityConfig } from "@/lib/flexibilityEngine";
import { analyzeFlexibilityTrials } from "@/lib/flexibilityAnalysis";
import { saveTestResult } from "@/lib/resultStorage";
import AccuracyPieChart from "@/components/results/AccuracyPieChart";
import ReactionTimeLineChart from "@/components/results/ReactionTimeLineChart";
import ResultViewToggle, { ResultViewMode } from "@/components/results/ResultViewToggle";
import type { TestPhase, TrialRecord } from "@/types";

export default function FlexibilityTestPage() {
  const [practiceTrials, setPracticeTrials] = useState<TrialRecord[]>([]);
  const [mainTrials, setMainTrials] = useState<TrialRecord[]>([]);

  return (
    <TestSessionShell
      title="인지적 유연성 검사"
      renderPhase={(phase, goToNext) => (
        <PhaseContent
          phase={phase}
          goToNext={goToNext}
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
  practiceTrials: TrialRecord[];
  setPracticeTrials: (trials: TrialRecord[]) => void;
  mainTrials: TrialRecord[];
  setMainTrials: (trials: TrialRecord[]) => void;
}

function PhaseContent({
  phase,
  goToNext,
  practiceTrials,
  setPracticeTrials,
  mainTrials,
  setMainTrials,
}: PhaseContentProps) {
  const [viewMode, setViewMode] = useState<ResultViewMode>("easy");

  switch (phase) {
    case "intro":
      return (
        <div className="space-y-6">
          <div className="rounded-2xl bg-indigo-50 p-6 ring-1 ring-indigo-200">
            <h2 className="text-lg font-bold text-slate-900">이런 검사예요</h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              화면에 도형이 나타나요. 처음에는 <strong>색깔</strong> 규칙(빨강 → 왼쪽, 파랑 →
              오른쪽)으로 분류하다가, 중간에 <strong>모양</strong> 규칙(원 → 왼쪽, 세모 → 오른쪽)으로
              바뀌어요. 화면 위쪽에 지금 규칙이 무엇인지 항상 보여줄 거예요.
            </p>
          </div>
          <DeviceRecommendationNotice />
          <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
            본 검사는 실행기능의 일부 특성을 살펴보기 위한 교육·연구용 수행과제이며, 의학적 또는
            심리학적 진단을 목적으로 하지 않습니다.
          </div>
          <button
            type="button"
            onClick={goToNext}
            className="w-full rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-600"
          >
            연습 문제 시작하기
          </button>
        </div>
      );

    case "practice":
      return (
        <FlexibilitySwitchTask
          config={practiceFlexibilityConfig}
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
            <SummaryStat label="정답률" value={`${analysis.overallAccuracy}%`} />
            <SummaryStat
              label="전환 반응시간 차이"
              value={analysis.switchCostRT !== null ? `${analysis.switchCostRT}ms` : "-"}
            />
          </div>
          <p className="text-sm text-slate-500">
            규칙이 바뀌는 순간에 조금 더 시간이 걸리는 건 자연스러운 일이에요. 이제 본 검사를
            시작해볼까요?
          </p>
          <button
            type="button"
            onClick={goToNext}
            className="w-full rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-600"
          >
            준비됐어요
          </button>
        </div>
      );
    }

    case "ready":
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">이제 시작합니다</h2>
          <p className="text-slate-500">
            본 검사 중에는 정답 여부를 알려주지 않아요. 준비되면 눌러주세요.
          </p>
          <button
            type="button"
            onClick={goToNext}
            className="w-full rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-600"
          >
            본 검사 시작
          </button>
        </div>
      );

    case "main":
      return (
        <FlexibilitySwitchTask
          config={defaultFlexibilityConfig}
          onComplete={(trials) => {
            setMainTrials(trials);
            saveTestResult("flexibility", trials);
            goToNext();
          }}
        />
      );

    case "complete":
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">수고했어요! 🎉</h2>
          <p className="text-slate-500">검사가 끝났어요. 결과를 확인해볼까요?</p>
          <button
            type="button"
            onClick={goToNext}
            className="w-full rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-600"
          >
            결과 보기
          </button>
        </div>
      );

    case "result": {
      const analysis = analyzeFlexibilityTrials(mainTrials);
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">나의 인지적 유연성 결과</h2>
          <ResultViewToggle mode={viewMode} onChange={setViewMode} />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryStat label="전체 정확도" value={`${analysis.overallAccuracy}%`} />
            <SummaryStat label="반복 문항 정확도" value={`${analysis.repeatAccuracy}%`} />
            <SummaryStat label="전환 문항 정확도" value={`${analysis.switchAccuracy}%`} />
            <SummaryStat
              label="switch cost (반응시간)"
              value={analysis.switchCostRT !== null ? `${analysis.switchCostRT}ms` : "-"}
            />
          </div>

          {viewMode === "easy" ? (
            <>
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <p className="mb-2 text-center text-sm font-semibold text-slate-600">정답/오답 비율</p>
                <AccuracyPieChart trials={mainTrials} />
              </div>
              <div className="rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
                <p>
                  규칙이 바뀐 직후(전환 문항)의 반응시간이 규칙이 같았을 때(반복 문항)보다{" "}
                  {analysis.switchCostRT !== null && analysis.switchCostRT > 0
                    ? `${analysis.switchCostRT}ms 더 걸렸어요.`
                    : "크게 다르지 않았어요."}{" "}
                  규칙이 바뀔 때 반응이 조금 느려지는 것은 인지적 유연성 과제에서 흔히 나타나는
                  자연스러운 현상이에요.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <p className="mb-2 text-center text-sm font-semibold text-slate-600">문항별 반응시간</p>
                <ReactionTimeLineChart trials={mainTrials} />
              </div>
              <ul className="space-y-1 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                <li>반복 문항 평균 반응시간: {analysis.repeatMeanRT !== null ? `${analysis.repeatMeanRT}ms` : "-"}</li>
                <li>전환 문항 평균 반응시간: {analysis.switchMeanRT !== null ? `${analysis.switchMeanRT}ms` : "-"}</li>
                <li>
                  정확도 기준 switch cost:{" "}
                  {analysis.switchCostAccuracy !== null ? `${analysis.switchCostAccuracy}%p` : "-"}
                </li>
                <li>
                  유효 문항 수: {analysis.validTrialCount} / {analysis.totalTrials}
                </li>
              </ul>
            </>
          )}

          <p className="rounded-xl bg-indigo-50 p-4 text-center text-xs text-indigo-800">
            이 결과는 실행기능의 일부 특성을 살펴본 수행과제 결과이며, 실행기능 전체나 진단을
            의미하지 않습니다.
          </p>

          <Link
            href="/tests"
            className="block w-full rounded-full border border-indigo-300 px-6 py-3 text-center text-base font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            검사 목록으로 돌아가기
          </Link>
        </div>
      );
    }

    default:
      return null;
  }
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
