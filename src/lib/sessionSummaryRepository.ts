import { supabase } from "./supabaseClient";
import type { EFDomain, TrialRecord } from "@/types";
import { analyzeInhibitionTrials } from "./inhibitionAnalysis";
import { analyzeWorkingMemoryTrials } from "./workingMemoryAnalysis";
import { analyzeFlexibilityTrials } from "./flexibilityAnalysis";
import { defaultInhibitionConfig } from "./inhibitionEngine";

// 검사 종류에 맞는 분석 함수를 골라 요약 지표(JSON)를 계산합니다.
// 이 요약값이 test_sessions.summary 컬럼에 저장되어, 문항별 원자료를 다시
// 계산하지 않고도 사람별/연령별 통계를 바로 낼 수 있게 해줍니다.
export function buildSessionSummary(
  domain: EFDomain,
  trials: TrialRecord[]
): Record<string, unknown> {
  if (domain === "inhibition") {
    return analyzeInhibitionTrials(
      trials,
      defaultInhibitionConfig.anticipatoryThresholdMs
    ) as unknown as Record<string, unknown>;
  }
  if (domain === "workingMemory") {
    return analyzeWorkingMemoryTrials(trials) as unknown as Record<string, unknown>;
  }
  return analyzeFlexibilityTrials(trials) as unknown as Record<string, unknown>;
}

export interface SessionSummaryRow {
  participantId: string;
  participantName: string | null;
  ageYears: number | null;
  ageMonths: number | null;
  task: EFDomain;
  date: string; // YYYY-MM-DD
  summary: Record<string, unknown> | null;
}

interface SessionSummaryDbRow {
  participant_id: string;
  participant_name: string | null;
  age_years: number | null;
  age_months: number | null;
  task_type: EFDomain;
  started_at: string;
  summary: Record<string, unknown> | null;
}

// 검사 한 번(세션)당 한 줄씩 쌓이는 "결과 요약" 목록을 가져옵니다.
// 문항별 원자료(rawDataRepository)와 달리, 사람별로 이미 계산된 지표만 가져오므로
// 데이터 양이 훨씬 적고 표준화 작업에 바로 쓰기 좋습니다.
export async function fetchSessionSummaries(taskFilter: EFDomain | "all"): Promise<SessionSummaryRow[]> {
  if (!supabase) return [];

  let query = supabase
    .from("test_sessions")
    .select("participant_id, participant_name, age_years, age_months, task_type, started_at, summary")
    .order("started_at", { ascending: false })
    .limit(2000);

  if (taskFilter !== "all") {
    query = query.eq("task_type", taskFilter);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.warn("결과 요약을 불러오지 못했습니다:", error?.message);
    return [];
  }

  return (data as SessionSummaryDbRow[]).map((row) => ({
    participantId: row.participant_id,
    participantName: row.participant_name,
    ageYears: row.age_years,
    ageMonths: row.age_months,
    task: row.task_type,
    date: row.started_at?.slice(0, 10) ?? "",
    summary: row.summary,
  }));
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

// summary(JSON)의 키를 모두 모아 CSV 컬럼으로 자동 확장합니다.
// 검사 종류마다 지표가 다르므로(예: 억제통제는 omissionCount, 작업기억은 maxSpanAchieved),
// 한 CSV에 다 같이 내보내되 해당 없는 칸은 빈 값으로 둡니다.
export function buildSessionSummaryCsv(rows: SessionSummaryRow[]): string {
  const summaryKeys = new Set<string>();
  rows.forEach((row) => {
    if (row.summary) Object.keys(row.summary).forEach((key) => summaryKeys.add(key));
  });
  const orderedSummaryKeys = Array.from(summaryKeys).sort();

  const header = ["participantId", "name", "ageYears", "ageMonths", "grade", "task", "date", ...orderedSummaryKeys];

  const lines = rows.map((row) => {
    const baseCells = [
      row.participantId,
      row.participantName ?? "",
      row.ageYears ?? "",
      row.ageMonths ?? "",
      "",
      row.task,
      row.date,
    ];
    const summaryCells = orderedSummaryKeys.map((key) => {
      const value = row.summary?.[key];
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    });
    return [...baseCells, ...summaryCells].map(escapeCsvCell).join(",");
  });

  return [header.join(","), ...lines].join("\n");
}
