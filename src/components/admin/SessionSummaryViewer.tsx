"use client";

import { Fragment, useEffect, useState } from "react";
import { downloadCsv } from "@/lib/rawDataRepository";
import {
  buildSessionSummaryCsv,
  fetchSessionSummaries,
  type SessionSummaryRow,
} from "@/lib/sessionSummaryRepository";
import type { EFDomain } from "@/types";

const TASK_LABELS: Record<EFDomain, string> = {
  inhibition: "억제통제",
  workingMemory: "작업기억",
  flexibility: "인지적 유연성",
};

// 검사 종류별로 화면에 보여줄 핵심 지표 한 가지씩 (전체 지표는 CSV/상세보기에서 확인)
function getHeadlineMetric(row: SessionSummaryRow): string {
  const summary = row.summary;
  if (!summary) return "-";
  if (row.task === "workingMemory") {
    return summary.maxSpanAchieved !== undefined ? `최대 ${summary.maxSpanAchieved}칸` : "-";
  }
  if (row.task === "flexibility") {
    return summary.switchCostRT !== undefined && summary.switchCostRT !== null
      ? `switch cost ${summary.switchCostRT}ms`
      : "-";
  }
  return summary.commissionCount !== undefined ? `오반응 ${summary.commissionCount}회` : "-";
}

function getAccuracy(row: SessionSummaryRow): string {
  const value = row.summary?.overallAccuracy;
  return typeof value === "number" ? `${value}%` : "-";
}

function getMeanRT(row: SessionSummaryRow): string {
  const summary = row.summary;
  if (!summary) return "-";
  const value = summary.meanRT ?? summary.meanResponseTime ?? summary.repeatMeanRT;
  return typeof value === "number" ? `${value}ms` : "-";
}

/**
 * 검사 한 번(세션)이 끝날 때마다 한 줄씩 쌓이는 요약 결과 화면입니다.
 * 문항별 원자료(RawDataViewer)보다 데이터 양이 훨씬 적고,
 * 이름/나이별로 바로 비교·평균을 낼 수 있어 표준화 작업에 적합합니다.
 */
export default function SessionSummaryViewer() {
  const [taskFilter, setTaskFilter] = useState<EFDomain | "all">("all");
  const [rows, setRows] = useState<SessionSummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchSessionSummaries(taskFilter).then((data) => {
      setRows(data);
      setIsLoading(false);
    });
  }, [taskFilter]);

  const handleDownload = () => {
    const csv = buildSessionSummaryCsv(rows);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(`ef-session-summary_${taskFilter}_${dateStr}.csv`, csv);
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
          CSV 다운로드 ({rows.length}건)
        </button>
      </div>

      <p className="text-xs text-indigo-600">
        ⚠️ 검사 1회당 1줄로 요약된 결과예요. 실명이 포함되어 있으니 안전하게 관리해주세요.
      </p>

      {isLoading ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-400">
          아직 완료된 검사가 없어요.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["이름", "나이", "검사", "정확도", "반응시간", "기타 지표", "날짜", ""].map((col) => (
                  <th key={col} className="whitespace-nowrap px-3 py-2 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <Fragment key={index}>
                  <tr className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">
                      {row.participantName ?? row.participantId.slice(0, 8) + "..."}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.ageYears !== null ? `${row.ageYears}세 ${row.ageMonths}개월` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{TASK_LABELS[row.task]}</td>
                    <td className="whitespace-nowrap px-3 py-2">{getAccuracy(row)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{getMeanRT(row)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{getHeadlineMetric(row)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{row.date}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        {expandedIndex === index ? "닫기" : "상세"}
                      </button>
                    </td>
                  </tr>
                  {expandedIndex === index && (
                    <tr className="border-t border-slate-100 bg-slate-50">
                      <td colSpan={8} className="px-3 py-2">
                        <pre className="whitespace-pre-wrap break-all text-[11px] text-slate-600">
                          {JSON.stringify(row.summary, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
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
