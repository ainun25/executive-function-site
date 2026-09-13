"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrialRecord } from "@/types";

// trial별 반응시간 추이를 보여주는 그래프 (섹션 13)
export default function ReactionTimeLineChart({ trials }: { trials: TrialRecord[] }) {
  const data = trials
    .filter((trial) => trial.reactionTime !== null)
    .map((trial) => ({ trial: trial.trialNumber, rt: trial.reactionTime as number }));

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">표시할 반응시간 데이터가 없어요.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="trial" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} width={40} />
        <Tooltip
          formatter={(value) => [`${value}ms`, "반응시간"]}
          labelFormatter={(label) => `${label}번째 문항`}
        />
        <Line type="monotone" dataKey="rt" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
