"use client";

import { useState } from "react";
import Link from "next/link";
import TestSessionShell from "@/components/tasks/common/TestSessionShell";
import DeviceRecommendationNotice from "@/components/tasks/common/DeviceRecommendationNotice";
import ParticipantGate from "@/components/tasks/common/ParticipantGate";
import GoNoGoTask from "@/components/tasks/inhibition/GoNoGoTask";
import { defaultInhibitionConfig, practiceInhibitionConfig } from "@/lib/inhibitionEngine";
import { analyzeInhibitionTrials } from "@/lib/inhibitionAnalysis";
import { saveTestResult } from "@/lib/resultStorage";
import AccuracyPieChart from "@/components/results/AccuracyPieChart";
import ReactionTimeLineChart from "@/components/results/ReactionTimeLineChart";
import ResultViewToggle, { ResultViewMode } from "@/components/results/ResultViewToggle";
import type { ParticipantInfo, TestPhase, TrialRecord } from "@/types";

export default function InhibitionTestPage() {
  const [practiceTrials, setPracticeTrials] = useState<TrialRecord[]>([]);
  const [mainTrials, setMainTrials] = useState<TrialRecord[]>([]);

  return (
    <ParticipantGate>
      {(participant) => (
        <TestSessionShell
          title="억제통제 검사"
          renderPhase={(phase, goToNext) => (
            <PhaseContent
              phase={phase}
              goToNext={goToNext}
              participant={participant}
              practiceTrials={practiceTrials}
              setPracticeTrials={setPracticeTrials}
              mainTrials={mainTrials}
              setMainTrials={setMainTrials}
            />
          )}
        />
      )}
    </ParticipantGate>
  );
}

interface PhaseContentProps {
  phase: TestPhase;
  goToNext: () => void;
  participant: ParticipantInfo;
  practiceTrials: TrialRecord[];
  setPracticeTrials: (trials: TrialRecord[]) => void;
  mainTrials: TrialRecord[];
  setMainTrials: (trials: TrialRecord[]) => void;
}

function PhaseContent({
  phase,
  goToNext,
  participant,
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
              화면 중앙에 동물 그림이 하나씩 나타나요. <strong>고양이🐱</strong>가 나오면 스페이스바
              또는 화면의 버튼을 최대한 빠르게 눌러요. 하지만 <strong>호랑이🐯</strong>가 나오면
              아무것도 누르지 않고 참아야 해요.
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
        <GoNoGoTask
          config={practiceInhibitionConfig}
          onComplete={(trials) => {
            setPracticeTrials(trials);
            goToNext();
          }}
        />
      );

    case "practiceResult": {
      const analysis = analyzeInhibitionTrials(
        practiceTrials,
        practiceInhibitionConfig.anticipatoryThresholdMs
      );
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">연습 결과 확인</h2>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-5 text-center">
            <SummaryStat label="정답률" value={`${analysis.overallAccuracy}%`} />
            <SummaryStat
              label="평균 반응시간"
              value={analysis.meanRT !== null ? `${analysis.meanRT}ms` : "-"}
            />
          </div>
          <p className="text-sm text-slate-500">
            연습에서 충분히 감을 잡았다면, 이제 본 검사를 시작해볼까요? 본 검사 중에는 정답 여부를
            알려주지 않아요.
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
        <GoNoGoTask
          config={defaultInhibitionConfig}
          onComplete={(trials) => {
            setMainTrials(trials);
            saveTestResult("inhibition", trials, participant);
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
      const analysis = analyzeInhibitionTrials(
        mainTrials,
        defaultInhibitionConfig.anticipatoryThresholdMs
      );
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">나의 억제통제 결과</h2>
          <ResultViewToggle mode={viewMode} onChange={setViewMode} />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryStat label="전체 정확도" value={`${analysis.overallAccuracy}%`} />
            <SummaryStat
              label="평균 반응시간"
              value={analysis.meanRT !== null ? `${analysis.meanRT}ms` : "-"}
            />
            <SummaryStat label="오반응 (누르면 안 될 때 누름)" value={`${analysis.commissionCount}회`} />
            <SummaryStat label="누락반응 (눌러야 할 때 안 누름)" value={`${analysis.omissionCount}회`} />
          </div>

          {viewMode === "easy" ? (
            <>
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <p className="mb-2 text-center text-sm font-semibold text-slate-600">정답/오답 비율</p>
                <AccuracyPieChart trials={mainTrials} />
              </div>
              <div className="rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
                {analysis.commissionCount > 0 ? (
                  <p>
                    반응하지 않아야 하는 상황에서 버튼을 누른 경우가 {analysis.commissionCount}차례
                    있었습니다. 억제통제 과제에서는 빠르게 반응하는 것뿐 아니라 필요할 때 멈추는 것도
                    중요해요.
                  </p>
                ) : (
                  <p>
                    반응하지 않아야 하는 상황에서는 잘 참아냈어요! 억제통제 과제에서는 이렇게 필요한
                    순간에 멈추는 것이 중요해요.
                  </p>
                )}
                {analysis.omissionCount > 0 && (
                  <p className="mt-2">
                    반응해야 하는 상황에서 반응하지 못한 경우도 {analysis.omissionCount}차례
                    있었어요. 집중이 흐트러졌을 수도 있어요.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <p className="mb-2 text-center text-sm font-semibold text-slate-600">문항별 반응시간</p>
                <ReactionTimeLineChart trials={mainTrials} />
              </div>
              <ul className="space-y-1 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                <li>GO 문항 정답률: {analysis.goAccuracy}%</li>
                <li>NO-GO 문항 정답률: {analysis.noGoAccuracy}%</li>
                <li>중앙값 반응시간: {analysis.medianRT !== null ? `${analysis.medianRT}ms` : "-"}</li>
                <li>반응시간 표준편차: {analysis.sdRT !== null ? `${analysis.sdRT}ms` : "-"}</li>
                <li>가장 빠른 반응시간: {analysis.minRT !== null ? `${analysis.minRT}ms` : "-"}</li>
                <li>가장 느린 반응시간: {analysis.maxRT !== null ? `${analysis.maxRT}ms` : "-"}</li>
                <li>지나치게 빠른 반응(anticipatory): {analysis.anticipatoryCount}회</li>
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
