"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TrialRecord } from "@/types";

const COLORS = ["#14b8a6", "#f43f5e"];

// 정답/오답 비율을 한눈에 보여주는 그래프 (섹션 13, 쉬운 결과 보기용)
export default function AccuracyPieChart({ trials }: { trials: TrialRecord[] }) {
  const validTrials = trials.filter((trial) => trial.validTrial);
  const correctCount = validTrials.filter((trial) => trial.isCorrect).length;
  const incorrectCount = validTrials.length - correctCount;

  if (validTrials.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">표시할 데이터가 없어요.</p>;
  }

  const data = [
    { name: "정답", value: correctCount },
    { name: "오답", value: incorrectCount },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
