"use client";

import { useEffect, useState } from "react";
import { buildRawDataCsv, downloadCsv, fetchRawDataRows, type RawDataRow } from "@/lib/rawDataRepository";
import { ageGroupShortLabel } from "@/lib/ageGroup";
import type { EFDomain } from "@/types";

const TASK_LABELS: Record<EFDomain, string> = {
  inhibition: "억제통제",
  workingMemory: "작업기억",
  flexibility: "인지적 유연성",
};

export default function RawDataViewer() {
  const [taskFilter, setTaskFilter] = useState<EFDomain | "all">("all");
  const [allRows, setRows] = useState<RawDataRow[]>([]);
  const [versionFilter, setVersionFilter] = useState<"all" | "standard" | "story">("all");
  const countByVersion = (value: "all" | "standard" | "story") =>
    value === "all" ? allRows.length : allRows.filter((row) => row.testVersion === value).length;
  const rows = versionFilter === "all" ? allRows : allRows.filter((row) => row.testVersion === versionFilter);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchRawDataRows(taskFilter).then((data) => {
      setRows(data);
      setIsLoading(false);
    });
  }, [taskFilter]);

  const handleDownload = () => {
    const csv = buildRawDataCsv(rows);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(`ef-raw-data_${versionFilter}_${taskFilter}_${dateStr}.csv`, csv);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterButton label="전체" isActive={taskFilter === "all"} onClick={() => setTaskFilter("all")} />
          {(Object.keys(TASK_LABELS) as EFDomain[]).map((task) => (
            <FilterButton
              key={task}
              label={TASK_LABELS[task]}
              isActive={taskFilter === task}
              onClick={() => setTaskFilter(task)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={rows.length === 0}
          className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-40"
        >
          CSV 다운로드 ({rows.length}행)
        </button>
      </div>


      {/* 검사 유형: 표준형과 스토리형은 점수를 직접 비교할 수 없으므로 따로 볼 수 있게 합니다 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">유형</span>
        {(
          [
            ["all", "전체"],
            ["standard", "표준형"],
            ["story", "스토리형"],
          ] as const
        ).map(([value, label]) => (
          <FilterButton
            key={value}
            label={`${label} (${countByVersion(value)})`}
            isActive={versionFilter === value}
            onClick={() => setVersionFilter(value)}
          />
        ))}
      </div>

      <p className="text-xs text-indigo-600">
        ⚠️ 이 화면과 CSV에는 참여자 실명이 포함되어 있어요. 관리자만 볼 수 있도록 계정 정보를
        안전하게 관리해주세요. CSV에는 학년(grade)과 연령군(ageGroup)도 포함돼요.
      </p>

      {isLoading ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-400">
          아직 저장된 검사 결과가 없어요.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {[
                  "name",
                  "age",
                  "ageGroup",
                  "version",
                  "task",
                  "trial",
                  "condition",
                  "stimulus",
                  "answer",
                  "correct",
                  "reactionTime",
                  "errorType",
                  "date",
                ].map((col) => (
                  <th key={col} className="whitespace-nowrap px-3 py-2 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((row, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">
                    {row.participantName ?? row.participantId.slice(0, 8) + "..."}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.ageYears !== null ? `${row.ageYears}세 ${row.ageMonths}개월` : "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{ageGroupShortLabel(row.ageGroup)}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.testVersion === "story" ? "스토리형" : "표준형"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{TASK_LABELS[row.task]}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.trialNumber}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.condition}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.stimulus}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.answer ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.isCorrect === null ? "-" : row.isCorrect ? "O" : "X"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{row.reactionTime ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.errorType || "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 100 && (
            <p className="border-t border-slate-100 p-3 text-center text-xs text-slate-400">
              화면에는 최근 100행만 표시돼요. CSV 다운로드에는 전체 {rows.length}행이 포함됩니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FilterButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        isActive ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
