"use client";

import { useState } from "react";
import Link from "next/link";
import TestSessionShell from "@/components/tasks/common/TestSessionShell";
import DeviceRecommendationNotice from "@/components/tasks/common/DeviceRecommendationNotice";
import SpanTask from "@/components/tasks/working-memory/SpanTask";
import { defaultWorkingMemoryConfig, practiceWorkingMemoryConfig } from "@/lib/workingMemoryEngine";
import { analyzeWorkingMemoryTrials } from "@/lib/workingMemoryAnalysis";
import { saveTestResult } from "@/lib/resultStorage";
import AccuracyPieChart from "@/components/results/AccuracyPieChart";
import ReactionTimeLineChart from "@/components/results/ReactionTimeLineChart";
import ResultViewToggle, { ResultViewMode } from "@/components/results/ResultViewToggle";
import type { TestPhase, TrialRecord } from "@/types";

export default function WorkingMemoryTestPage() {
  const [practiceTrials, setPracticeTrials] = useState<TrialRecord[]>([]);
  const [mainTrials, setMainTrials] = useState<TrialRecord[]>([]);

  return (
    <TestSessionShell
      title="작업기억 검사"
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
          <div className="rounded-2xl bg-sky-50 p-6 ring-1 ring-sky-200">
            <h2 className="text-lg font-bold text-slate-900">이런 검사예요</h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              9개 칸 중 몇 개가 순서대로 반짝여요. 반짝임이 끝나면, 방금 본 순서 그대로 칸을
              눌러주세요. 처음에는 2개부터 시작해서 맞출 때마다 점점 길어져요.
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
            className="w-full rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white hover:bg-sky-600"
          >
            연습 문제 시작하기
          </button>
        </div>
      );

    case "practice":
      return (
        <SpanTask
          config={practiceWorkingMemoryConfig}
          onComplete={(trials) => {
            setPracticeTrials(trials);
            goToNext();
          }}
        />
      );

    case "practiceResult": {
      const analysis = analyzeWorkingMemoryTrials(practiceTrials);
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">연습 결과 확인</h2>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-5 text-center">
            <SummaryStat label="정답률" value={`${analysis.overallAccuracy}%`} />
            <SummaryStat label="맞춘 최대 칸 수" value={`${analysis.maxSpanAchieved}개`} />
          </div>
          <p className="text-sm text-slate-500">
            연습에서 순서를 기억하는 감을 잡았다면, 이제 본 검사를 시작해볼까요?
          </p>
          <button
            type="button"
            onClick={goToNext}
            className="w-full rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white hover:bg-sky-600"
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
            className="w-full rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white hover:bg-sky-600"
          >
            본 검사 시작
          </button>
        </div>
      );

    case "main":
      return (
        <SpanTask
          config={defaultWorkingMemoryConfig}
          onComplete={(trials) => {
            setMainTrials(trials);
            saveTestResult("workingMemory", trials);
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
            className="w-full rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white hover:bg-sky-600"
          >
            결과 보기
          </button>
        </div>
      );

    case "result": {
      const analysis = analyzeWorkingMemoryTrials(mainTrials);
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">나의 작업기억 결과</h2>
          <ResultViewToggle mode={viewMode} onChange={setViewMode} />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryStat label="전체 정답률" value={`${analysis.overallAccuracy}%`} />
            <SummaryStat label="최대 기억 칸 수" value={`${analysis.maxSpanAchieved}개`} />
            <SummaryStat
              label="평균 응답시간"
              value={analysis.meanResponseTime !== null ? `${analysis.meanResponseTime}ms` : "-"}
            />
            <SummaryStat label="순서만 틀린 횟수" value={`${analysis.orderErrorCount}회`} />
          </div>

          {viewMode === "easy" ? (
            <>
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <p className="mb-2 text-center text-sm font-semibold text-slate-600">정답/오답 비율</p>
                <AccuracyPieChart trials={mainTrials} />
              </div>
              <div className="rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
                <p>
                  최대 {analysis.maxSpanAchieved}개의 칸까지 순서대로 기억했어요. 작업기억 과제에서는
                  정보를 머릿속에 유지하면서 동시에 사용하는 능력을 살펴봐요.
                </p>
                {analysis.orderErrorCount > 0 && (
                  <p className="mt-2">
                    고른 칸은 맞았지만 순서가 달랐던 경우가 {analysis.orderErrorCount}차례 있었어요.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <p className="mb-2 text-center text-sm font-semibold text-slate-600">문항별 응답시간</p>
                <ReactionTimeLineChart trials={mainTrials} />
              </div>
              <ul className="space-y-1 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                {analysis.perSpanAccuracy.map((item) => (
                  <li key={item.span}>
                    {item.span}개 기억 단계: 정답률 {item.accuracy}% ({item.trials}회 시도)
                  </li>
                ))}
                <li>순서 오류(고른 칸은 맞음): {analysis.orderErrorCount}회</li>
                <li>선택 오류(고른 칸 자체가 다름): {analysis.itemErrorCount}회</li>
                <li>전체 시행 수: {analysis.totalTrials}</li>
              </ul>
            </>
          )}

          <p className="rounded-xl bg-amber-50 p-4 text-center text-xs text-amber-800">
            이 결과는 실행기능의 일부 특성을 살펴본 수행과제 결과이며, 실행기능 전체나 진단을
            의미하지 않습니다.
          </p>

          <Link
            href="/tests"
            className="block w-full rounded-full border border-sky-300 px-6 py-3 text-center text-base font-semibold text-sky-600 hover:bg-sky-50"
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
