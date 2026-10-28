"use client";

import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analyzeFlexibilityTrials } from "@/lib/flexibilityAnalysis";
import { summarizeByBlock, type BlockSummary } from "@/lib/storyFlexibility";
import { ageGroupLabel, gradeLabel } from "@/lib/ageGroup";
import type { ParticipantInfo, TrialRecord } from "@/types";
import ReactionTimeLineChart from "./ReactionTimeLineChart";
import ResultViewToggle, { type ResultViewMode } from "./ResultViewToggle";

interface StoryFlexibilityReportProps {
  trials: TrialRecord[];
  participant: ParticipantInfo;
}

/**
 * 스토리형 인지적 유연성 검사("규칙 변경")의 결과서입니다.
 *  - 쉬운 결과(아이용): 암호 해독 3단계 카드, "암호가 바뀐 직후 / 같은 암호가 이어질 때" 비교.
 *  - 상세 결과(어른용): 단계별 표와 그래프, 전환 비용(switch cost), 문항별 반응시간.
 *  - 인쇄/PDF 저장 버튼을 제공합니다.
 * ⚠️ 표준화된 규준이 없으므로 "우수/부족" 같은 해석이나 진단적 표현은 쓰지 않습니다.
 */
export default function StoryFlexibilityReport({ trials, participant }: StoryFlexibilityReportProps) {
  const [viewMode, setViewMode] = useState<ResultViewMode>("easy");
  const blocks = summarizeByBlock(trials);
  const analysis = analyzeFlexibilityTrials(trials);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <ResultViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">지구 수호대 작전 3부: 규칙 변경 결과서</p>
        <p className="mt-1">
          {participant.name} · 만 {participant.ageYears}세 {participant.ageMonths}개월 ·{" "}
          {gradeLabel(participant.grade)}
          {participant.grade === "preschool" ? "" : ` (${ageGroupLabel(participant.ageGroup)})`}
        </p>
      </div>

      {viewMode === "easy" ? (
        <EasyView blocks={blocks} analysis={analysis} />
      ) : (
        <DetailView blocks={blocks} analysis={analysis} trials={trials} />
      )}

      <p className="rounded-xl bg-indigo-50 p-4 text-center text-xs leading-relaxed text-indigo-800">
        이 결과는 인지적 유연성의 일부 특성을 살펴본 수행과제 결과이며, 진단이 아니에요. 규칙이 바뀐 직후 반응이
        조금 느려지는 것은 누구에게나 나타나는 자연스러운 현상이에요. 스토리형 검사는 표준형 검사와 그림과 구성이
        달라서 두 검사의 점수를 직접 비교할 수 없어요.
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

type Analysis = ReturnType<typeof analyzeFlexibilityTrials>;

function ms(value: number | null): string {
  return value !== null ? `${value}ms` : "-";
}

function EasyView({ blocks, analysis }: { blocks: BlockSummary[]; analysis: Analysis }) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-b from-[#1a1f3c] to-[#050a18] p-6 text-center text-white">
        <h2 className="text-2xl font-extrabold text-[#00ff88]">🔐 암호 해독 보고서</h2>
        <p className="mt-2 text-slate-200">바뀌는 암호를 끝까지 따라간 멋진 요원이에요!</p>
        <p className="mt-2 text-3xl" aria-label="별 세 개">
          ⭐⭐⭐
        </p>
      </div>

      {/* 세 단계를 길게 이어 보여줍니다: 암호가 점점 어려워지는 이야기 흐름 */}
      <ol className="space-y-3">
        {blocks.map((block, index) => (
          <li key={block.block} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 font-bold text-white">
              {index + 1}
            </span>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{block.title}</p>
              <p className="text-xs text-slate-400">{block.note}</p>
              <p className="mt-2 text-slate-600">
                🎯 맞게 나눈 신호 <strong className="text-slate-900">{block.correct}</strong> / {block.trials}
              </p>
              <p className="text-slate-600">
                ⚡ 맞게 나눈 평균 속도 <strong className="text-slate-900">{ms(block.meanRT)}</strong>
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-3 text-center text-sm font-semibold text-slate-600">3단계에서 암호가 바뀔 때</p>
        <div className="grid grid-cols-2 gap-3 text-center text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">같은 암호가 이어질 때</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{ms(analysis.repeatMeanRT)}</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-3">
            <p className="text-xs text-indigo-700">암호가 바뀐 직후</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{ms(analysis.switchMeanRT)}</p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          {analysis.switchCostRT !== null && analysis.switchCostRT > 0
            ? `암호가 바뀐 직후에는 ${analysis.switchCostRT}ms 더 걸렸어요. 바뀐 암호로 마음을 돌리느라 잠깐 걸리는 시간이에요.`
            : "암호가 바뀌어도 속도가 크게 달라지지 않았어요."}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 text-center text-sm font-semibold text-slate-600">단계별 모습</p>
        <BlockChart blocks={blocks} />
      </div>
    </div>
  );
}

function DetailView({ blocks, analysis, trials }: { blocks: BlockSummary[]; analysis: Analysis; trials: TrialRecord[] }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="전체 정확도" value={`${analysis.overallAccuracy}%`} />
        <Stat label="반복 문항 정확도" value={`${analysis.repeatAccuracy}%`} />
        <Stat label="전환 문항 정확도" value={`${analysis.switchAccuracy}%`} />
        <Stat label="switch cost (반응시간)" value={ms(analysis.switchCostRT)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {["단계", "문항", "정답", "정확도", "무응답", "평균 반응시간(정답)"].map((column) => (
                <th key={column} className="whitespace-nowrap px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr key={block.block} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">{block.title}</td>
                <td className="px-3 py-2">{block.trials}</td>
                <td className="px-3 py-2">{block.correct}</td>
                <td className="px-3 py-2">{block.accuracy !== null ? `${block.accuracy}%` : "-"}</td>
                <td className="px-3 py-2">{block.omissions}</td>
                <td className="whitespace-nowrap px-3 py-2">{ms(block.meanRT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 text-center text-sm font-semibold text-slate-600">단계별 비교</p>
        <BlockChart blocks={blocks} />
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 text-center text-sm font-semibold text-slate-600">문항별 반응시간</p>
        <ReactionTimeLineChart trials={trials} />
      </div>

      <ul className="space-y-1 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
        <li>반복 문항 평균 반응시간: {ms(analysis.repeatMeanRT)}</li>
        <li>전환 문항 평균 반응시간: {ms(analysis.switchMeanRT)}</li>
        <li>
          정확도 기준 switch cost: {analysis.switchCostAccuracy !== null ? `${analysis.switchCostAccuracy}%p` : "-"}
        </li>
        <li>
          유효 문항 수: {analysis.validTrialCount} / {analysis.totalTrials}
        </li>
      </ul>
    </div>
  );
}

// 정확도(막대) + 속도(선)를 한 그래프에 보여줍니다.
function BlockChart({ blocks }: { blocks: BlockSummary[] }) {
  const data = blocks.map((block) => ({
    name: block.title.split(":")[0],
    정확도: block.accuracy,
    속도: block.meanRT,
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
        <Bar yAxisId="left" dataKey="정확도" fill="#4f46e5" radius={[4, 4, 0, 0]} />
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
