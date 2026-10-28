"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyzeInhibitionTrials } from "@/lib/inhibitionAnalysis";
import { ageGroupLabel, gradeLabel } from "@/lib/ageGroup";
import { summarizeByStage, type StageSummary } from "@/lib/storyInhibition";
import type { ParticipantInfo, TrialRecord } from "@/types";
import ReactionTimeLineChart from "./ReactionTimeLineChart";
import ResultViewToggle, { type ResultViewMode } from "./ResultViewToggle";

interface StoryInhibitionReportProps {
  trials: TrialRecord[];
  anticipatoryThresholdMs: number;
  participant: ParticipantInfo;
}

/**
 * 스토리형 억제통제 검사의 결과서입니다.
 *  - 쉬운 결과(아이용): 스토리 테마, 단계별 카드와 그래프. 등급/능력 평가 없이 해낸 것을 칭찬합니다.
 *  - 상세 결과(어른용): 전체 지표, 단계별 표, 문항별 반응시간 그래프.
 *  - 인쇄/PDF 저장 버튼을 제공합니다.
 * ⚠️ 표준화된 규준이 없으므로 "우수/부족" 같은 해석이나 진단적 표현은 쓰지 않습니다.
 */
export default function StoryInhibitionReport({ trials, anticipatoryThresholdMs, participant }: StoryInhibitionReportProps) {
  const [viewMode, setViewMode] = useState<ResultViewMode>("easy");
  const stages = summarizeByStage(trials);
  const analysis = analyzeInhibitionTrials(trials, anticipatoryThresholdMs);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <ResultViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">지구 수호대 작전 1부: 요원 선별 결과서</p>
        <p className="mt-1">
          {participant.name} · 만 {participant.ageYears}세 {participant.ageMonths}개월 ·{" "}
          {gradeLabel(participant.grade)}
          {participant.grade === "preschool" ? "" : ` (${ageGroupLabel(participant.ageGroup)})`}
        </p>
      </div>

      {viewMode === "easy" ? (
        <EasyView stages={stages} />
      ) : (
        <DetailView stages={stages} analysis={analysis} trials={trials} anticipatoryThresholdMs={anticipatoryThresholdMs} />
      )}

      <p className="rounded-xl bg-indigo-50 p-4 text-center text-xs leading-relaxed text-indigo-800">
        이 결과는 억제통제의 일부 특성을 살펴본 수행과제 결과이며, 진단이 아니에요. 스토리형 검사는 표준형
        검사와 그림과 구성이 달라서 두 검사의 점수를 직접 비교할 수 없어요.
      </p>

      <button
        type="button"
        onClick={() => window.print()}
        className="w-full rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 print:hidden"
      >
        🖨️ 결과서 인쇄 / PDF로 저장
      </button>
    </div>
  );
}

function EasyView({ stages }: { stages: StageSummary[] }) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-b from-[#1a1f3c] to-[#050a18] p-6 text-center text-white">
        <h2 className="text-2xl font-extrabold text-[#00ff88]">🏆 미션 완료 보고서</h2>
        <p className="mt-2 text-slate-200">3단계를 끝까지 해낸 멋진 요원이에요!</p>
        <p className="mt-2 text-3xl" aria-label="별 세 개">
          ⭐⭐⭐
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stages.map((stage) => (
          <div key={stage.stage} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <p className="font-bold text-slate-900">{stage.title}</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>
                🤝 아군에게 인사했어요 <strong className="text-slate-900">{stage.allyHits}</strong> / {stage.allyTotal}
              </li>
              <li>
                ✋ 적군을 잘 참았어요 <strong className="text-slate-900">{stage.enemyHolds}</strong> / {stage.enemyTotal}
              </li>
              <li>
                ⚡ 인사한 평균 속도{" "}
                <strong className="text-slate-900">{stage.meanRT !== null ? `${stage.meanRT}ms` : "-"}</strong>
              </li>
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 text-center text-sm font-semibold text-slate-600">단계별 모습</p>
        <StageChart stages={stages} />
      </div>
    </div>
  );
}

function DetailView({
  stages,
  analysis,
  trials,
}: {
  stages: StageSummary[];
  analysis: ReturnType<typeof analyzeInhibitionTrials>;
  trials: TrialRecord[];
  anticipatoryThresholdMs: number;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="전체 정확도" value={`${analysis.overallAccuracy}%`} />
        <Stat label="평균 반응시간" value={analysis.meanRT !== null ? `${analysis.meanRT}ms` : "-"} />
        <Stat label="오반응 (적군에게 반응)" value={`${analysis.commissionCount}회`} />
        <Stat label="누락반응 (아군에게 반응 안 함)" value={`${analysis.omissionCount}회`} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {["단계", "문항", "아군 반응", "적군 참기", "오반응", "누락", "평균 반응시간"].map((column) => (
                <th key={column} className="whitespace-nowrap px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => (
              <tr key={stage.stage} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">{stage.title}</td>
                <td className="px-3 py-2">{stage.trials}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {stage.allyHits}/{stage.allyTotal}
                  {stage.allyHitRate !== null && <span className="text-slate-400"> ({stage.allyHitRate}%)</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {stage.enemyHolds}/{stage.enemyTotal}
                  {stage.enemyHoldRate !== null && <span className="text-slate-400"> ({stage.enemyHoldRate}%)</span>}
                </td>
                <td className="px-3 py-2">{stage.commissions}</td>
                <td className="px-3 py-2">{stage.omissions}</td>
                <td className="whitespace-nowrap px-3 py-2">{stage.meanRT !== null ? `${stage.meanRT}ms` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 text-center text-sm font-semibold text-slate-600">단계별 비교</p>
        <StageChart stages={stages} />
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 text-center text-sm font-semibold text-slate-600">문항별 반응시간</p>
        <ReactionTimeLineChart trials={trials} />
      </div>

      <ul className="space-y-1 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
        <li>아군 문항 정답률: {analysis.goAccuracy}%</li>
        <li>적군 문항 정답률(참기): {analysis.noGoAccuracy}%</li>
        <li>중앙값 반응시간: {analysis.medianRT !== null ? `${analysis.medianRT}ms` : "-"}</li>
        <li>반응시간 표준편차: {analysis.sdRT !== null ? `${analysis.sdRT}ms` : "-"}</li>
        <li>가장 빠른 / 가장 느린 반응시간: {analysis.minRT ?? "-"}ms / {analysis.maxRT ?? "-"}ms</li>
        <li>지나치게 빠른 반응(anticipatory): {analysis.anticipatoryCount}회</li>
        <li>
          유효 문항 수: {analysis.validTrialCount} / {analysis.totalTrials}
        </li>
      </ul>
    </div>
  );
}

// 올려주신 결과서처럼 "정확도(막대) + 속도(선)"를 한 그래프에 보여줍니다.
function StageChart({ stages }: { stages: StageSummary[] }) {
  const data = stages.map((stage) => ({
    name: stage.title.split(":")[0],
    아군인사율: stage.allyHitRate,
    적군참기율: stage.enemyHoldRate,
    속도: stage.meanRT,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} width={36} unit="%" />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} width={44} unit="ms" />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="아군인사율" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="left" dataKey="적군참기율" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="속도" stroke="#334155" strokeWidth={2} dot={{ r: 4 }} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
