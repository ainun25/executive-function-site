"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface DomainAccuracyDatum {
  domain: string;
  accuracy: number; // %
}

// "내 결과" 페이지에서 3개 실행기능 영역의 정확도를 한눈에 비교하는 그래프
export default function DomainAccuracyChart({ data }: { data: DomainAccuracyDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="domain" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickLine={false} width={36} unit="%" />
        <Tooltip formatter={(value) => [`${value}%`, "정확도"]} />
        <Bar dataKey="accuracy" fill="#14b8a6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
