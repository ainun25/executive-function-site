"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAllTestResults, clearAllResults } from "@/lib/resultStorage";
import { analyzeInhibitionTrials } from "@/lib/inhibitionAnalysis";
import { analyzeWorkingMemoryTrials } from "@/lib/workingMemoryAnalysis";
import { analyzeFlexibilityTrials } from "@/lib/flexibilityAnalysis";
import { defaultInhibitionConfig } from "@/lib/inhibitionEngine";
import DomainAccuracyChart from "@/components/results/DomainAccuracyChart";
import { testRoutes } from "@/data/efDomains";
import type { TestSessionSummary } from "@/types";

interface LoadedResults {
  inhibition: TestSessionSummary | null;
  workingMemory: TestSessionSummary | null;
  flexibility: TestSessionSummary | null;
}

export default function ResultsPage() {
  const [results, setResults] = useState<LoadedResults | null>(null);

  useEffect(() => {
    setResults(loadAllTestResults());
  }, []);

  if (!results) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-400">불러오는 중...</div>;
  }

  const hasAnyResult = results.inhibition || results.workingMemory || results.flexibility;

  const inhibitionAnalysis = results.inhibition
    ? analyzeInhibitionTrials(results.inhibition.trials, defaultInhibitionConfig.anticipatoryThresholdMs)
    : null;
  const workingMemoryAnalysis = results.workingMemory
    ? analyzeWorkingMemoryTrials(results.workingMemory.trials)
    : null;
  const flexibilityAnalysis = results.flexibility
    ? analyzeFlexibilityTrials(results.flexibility.trials)
    : null;

  const chartData = [
    { domain: "억제통제", accuracy: inhibitionAnalysis?.overallAccuracy ?? 0 },
    { domain: "작업기억", accuracy: workingMemoryAnalysis?.overallAccuracy ?? 0 },
    { domain: "인지적 유연성", accuracy: flexibilityAnalysis?.overallAccuracy ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">내 결과</h1>
        <p className="mt-4 text-base text-slate-600">
          지금까지 완료한 실행기능 검사 결과를 한눈에 볼 수 있어요.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          이 결과는 이 브라우저에만 임시로 저장돼요 (데모 모드). 브라우저 데이터를 지우면 사라져요.
        </p>
      </header>

      {!hasAnyResult ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-slate-500">아직 완료한 검사가 없어요. 검사를 먼저 진행해보세요!</p>
          <Link
            href="/tests"
            className="mt-4 inline-block rounded-full bg-teal-500 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-600"
          >
            실행기능 검사 하러 가기
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="mb-2 text-center text-sm font-semibold text-slate-600">
              3가지 영역 정확도 비교
            </h2>
            <DomainAccuracyChart data={chartData} />
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <DomainResultCard
              title="억제통제"
              color="rose"
              href={testRoutes.inhibition}
              analysis={
                inhibitionAnalysis
                  ? [
                      { label: "정확도", value: `${inhibitionAnalysis.overallAccuracy}%` },
                      {
                        label: "평균 반응시간",
                        value: inhibitionAnalysis.meanRT !== null ? `${inhibitionAnalysis.meanRT}ms` : "-",
                      },
                      { label: "오반응", value: `${inhibitionAnalysis.commissionCount}회` },
                      { label: "누락반응", value: `${inhibitionAnalysis.omissionCount}회` },
                    ]
                  : null
              }
            />
            <DomainResultCard
              title="작업기억"
              color="sky"
              href={testRoutes.workingMemory}
              analysis={
                workingMemoryAnalysis
                  ? [
                      { label: "정확도", value: `${workingMemoryAnalysis.overallAccuracy}%` },
                      { label: "최대 기억 칸 수", value: `${workingMemoryAnalysis.maxSpanAchieved}개` },
                      {
                        label: "평균 응답시간",
                        value:
                          workingMemoryAnalysis.meanResponseTime !== null
                            ? `${workingMemoryAnalysis.meanResponseTime}ms`
                            : "-",
                      },
                    ]
                  : null
              }
            />
            <DomainResultCard
              title="인지적 유연성"
              color="amber"
              href={testRoutes.flexibility}
              analysis={
                flexibilityAnalysis
                  ? [
                      { label: "정확도", value: `${flexibilityAnalysis.overallAccuracy}%` },
                      {
                        label: "switch cost",
                        value:
                          flexibilityAnalysis.switchCostRT !== null
                            ? `${flexibilityAnalysis.switchCostRT}ms`
                            : "-",
                      },
                    ]
                  : null
              }
            />
          </div>

          <p className="mt-8 rounded-xl bg-amber-50 p-4 text-center text-xs text-amber-800">
            이 결과들은 각 실행기능의 일부 특성을 살펴본 수행과제 결과이며, 세 가지 검사만으로
            실행기능 전체를 판단하거나 진단할 수는 없습니다.
          </p>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("저장된 검사 결과를 모두 지울까요? 되돌릴 수 없어요.")) {
                  clearAllResults();
                  setResults(loadAllTestResults());
                }
              }}
              className="text-sm text-slate-400 hover:underline"
            >
              결과 모두 지우기
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface AnalysisItem {
  label: string;
  value: string;
}

function DomainResultCard({
  title,
  color,
  href,
  analysis,
}: {
  title: string;
  color: "rose" | "sky" | "amber";
  href: string;
  analysis: AnalysisItem[] | null;
}) {
  const ringColor = {
    rose: "ring-rose-200",
    sky: "ring-sky-200",
    amber: "ring-amber-200",
  }[color];

  return (
    <div className={`rounded-2xl bg-white p-5 ring-1 ${ringColor}`}>
      <h3 className="font-bold text-slate-900">{title}</h3>
      {analysis ? (
        <ul className="mt-3 space-y-2">
          {analysis.map((item) => (
            <li key={item.label} className="flex justify-between text-sm">
              <span className="text-slate-500">{item.label}</span>
              <span className="font-semibold text-slate-800">{item.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="mt-3 text-sm text-slate-400">아직 완료하지 않았어요.</p>
          <Link href={href} className="mt-3 inline-block text-sm font-semibold text-teal-600 hover:underline">
            검사하러 가기 →
          </Link>
        </>
      )}
    </div>
  );
}
