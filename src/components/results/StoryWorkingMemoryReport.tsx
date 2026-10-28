"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analyzeWorkingMemoryTrials } from "@/lib/workingMemoryAnalysis";
import { ageGroupLabel, gradeLabel } from "@/lib/ageGroup";
import type { ParticipantInfo, TrialRecord } from "@/types";
import ReactionTimeLineChart from "./ReactionTimeLineChart";
import ResultViewToggle, { type ResultViewMode } from "./ResultViewToggle";

interface StoryWorkingMemoryReportProps {
  trials: TrialRecord[];
  participant: ParticipantInfo;
}

/**
 * 스토리형 작업기억 검사("신호 기억")의 결과서입니다.
 *  - 쉬운 결과(아이용): 받아 적은 신호 길이를 "신호탑"으로 보여주고 해낸 것을 칭찬합니다.
 *  - 상세 결과(어른용): 신호 길이별 표와 그래프, 순서/선택 오류, 응답시간.
 *  - 인쇄/PDF 저장 버튼을 제공합니다.
 * ⚠️ 표준화된 규준이 없으므로 "우수/부족" 같은 해석이나 진단적 표현은 쓰지 않습니다.
 */
export default function StoryWorkingMemoryReport({ trials, participant }: StoryWorkingMemoryReportProps) {
  const [viewMode, setViewMode] = useState<ResultViewMode>("easy");
  const analysis = analyzeWorkingMemoryTrials(trials);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <ResultViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">지구 수호대 작전 2부: 신호 기억 결과서</p>
        <p className="mt-1">
          {participant.name} · 만 {participant.ageYears}세 {participant.ageMonths}개월 ·{" "}
          {gradeLabel(participant.grade)}
          {participant.grade === "preschool" ? "" : ` (${ageGroupLabel(participant.ageGroup)})`}
        </p>
      </div>

      {viewMode === "easy" ? <EasyView analysis={analysis} /> : <DetailView analysis={analysis} trials={trials} />}

      <p className="rounded-xl bg-indigo-50 p-4 text-center text-xs leading-relaxed text-indigo-800">
        이 결과는 작업기억의 일부 특성을 살펴본 수행과제 결과이며, 진단이 아니에요. 스토리형 검사는 표준형 검사와
        그림과 구성이 달라서 두 검사의 점수를 직접 비교할 수 없어요.
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

type Analysis = ReturnType<typeof analyzeWorkingMemoryTrials>;

function EasyView({ analysis }: { analysis: Analysis }) {
  const levels = analysis.perSpanAccuracy;
  const reached = analysis.maxSpanAchieved;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-b from-[#1a1f3c] to-[#050a18] p-6 text-center text-white">
        <h2 className="text-2xl font-extrabold text-[#00ff88]">📡 신호 기억 보고서</h2>
        {reached > 0 ? (
          <>
            <p className="mt-2 text-slate-200">기지 신호를 순서대로 기억해서 보냈어요!</p>
            <p className="mt-3 text-4xl font-extrabold text-white">
              {reached}
              <span className="text-lg font-semibold text-slate-300">개 신호까지</span>
            </p>
          </>
        ) : (
          <p className="mt-2 text-slate-200">끝까지 도전한 멋진 요원이에요! 다음엔 더 잘 들릴 거예요.</p>
        )}
      </div>

      {/* 신호탑: 신호 길이마다 한 층씩. 순서대로 보낸 층은 켜지고, 아직 못 한 층은 꺼져 있어요. */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-3 text-center text-sm font-semibold text-slate-600">나의 신호탑</p>
        <div className="mx-auto flex max-w-xs flex-col-reverse gap-2">
          {levels.map((level) => {
            const lit = level.span <= reached;
            return (
              <div
                key={level.span}
                className={`flex items-center justify-between rounded-xl px-4 py-2 text-sm font-semibold ${
                  lit ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <span>신호 {level.span}개</span>
                <span>{lit ? "✅ 전송 성공" : "도전했어요"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {analysis.orderErrorCount > 0 && (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-600">
          기지는 잘 찾았는데 순서가 바뀐 적이 {analysis.orderErrorCount}번 있었어요. 순서를 기억하는 건 쉽지 않은
          일이에요!
        </p>
      )}
    </div>
  );
}

function DetailView({ analysis, trials }: { analysis: Analysis; trials: TrialRecord[] }) {
  const chartData = analysis.perSpanAccuracy.map((item) => ({ name: `${item.span}개`, 정답률: item.accuracy }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="전체 정답률" value={`${analysis.overallAccuracy}%`} />
        <Stat label="최대 기억 신호 수" value={`${analysis.maxSpanAchieved}개`} />
        <Stat
          label="평균 응답시간"
          value={analysis.meanResponseTime !== null ? `${analysis.meanResponseTime}ms` : "-"}
        />
        <Stat label="전체 시행 수" value={`${analysis.totalTrials}회`} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {["신호 길이", "시도 횟수", "정답률"].map((column) => (
                <th key={column} className="whitespace-nowrap px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysis.perSpanAccuracy.map((item) => (
              <tr key={item.span} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-700">{item.span}개</td>
                <td className="px-3 py-2">{item.trials}</td>
                <td className="px-3 py-2">{item.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 text-center text-sm font-semibold text-slate-600">신호 길이별 정답률</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} width={36} unit="%" />
            <Tooltip />
            <Bar dataKey="정답률" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 text-center text-sm font-semibold text-slate-600">문항별 응답시간</p>
        <ReactionTimeLineChart trials={trials} />
      </div>

      <ul className="space-y-1 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
        <li>순서 오류(고른 기지는 맞음): {analysis.orderErrorCount}회</li>
        <li>선택 오류(고른 기지 자체가 다름): {analysis.itemErrorCount}회</li>
      </ul>
    </div>
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
