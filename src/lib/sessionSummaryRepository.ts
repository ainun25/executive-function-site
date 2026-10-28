import { supabase } from "./supabaseClient";
import type { EFDomain, TestVersion, TrialRecord } from "@/types";
import { summarizeByStage } from "./storyInhibition";
import { analyzeCapacityTrials } from "./storyCapacity";
import { summarizeByBlock } from "./storyFlexibility";
import { analyzeInhibitionTrials } from "./inhibitionAnalysis";
import { analyzeWorkingMemoryTrials } from "./workingMemoryAnalysis";
import { analyzeFlexibilityTrials } from "./flexibilityAnalysis";
import { defaultInhibitionConfig } from "./inhibitionEngine";

// 검사 종류에 맞는 분석 함수를 골라 요약 지표(JSON)를 계산합니다.
// 이 요약값이 test_sessions.summary 컬럼에 저장되어, 문항별 원자료를 다시
// 계산하지 않고도 사람별/연령별 통계를 바로 낼 수 있게 해줍니다.
// settings는 그 검사를 진행한 시점의 검사 설정(문항 수, 기준값 등)이며,
// testSettings로 함께 저장해 나중에 설정이 다른 결과를 구분해 분석할 수 있게 합니다.
export function buildSessionSummary(
  domain: EFDomain,
  trials: TrialRecord[],
  settings?: Record<string, number>,
  version: TestVersion = "standard"
): Record<string, unknown> {
  let analysis: Record<string, unknown>;
  if (domain === "inhibition") {
    analysis = analyzeInhibitionTrials(
      trials,
      settings?.anticipatoryThresholdMs ?? defaultInhibitionConfig.anticipatoryThresholdMs
    ) as unknown as Record<string, unknown>;
  } else if (domain === "workingMemory") {
    analysis = analyzeWorkingMemoryTrials(trials) as unknown as Record<string, unknown>;
  } else {
    analysis = analyzeFlexibilityTrials(trials) as unknown as Record<string, unknown>;
  }
  // 스토리형 억제통제는 단계(행성/UFO/요원)별 요약도 함께 저장합니다.
  if (version === "story" && domain === "inhibition") {
    analysis = { ...analysis, stageSummary: summarizeByStage(trials) };
  }
  // 스토리형 작업기억은 보급품 확인(기억 용량) 요약도 함께 저장합니다.
  if (version === "story" && domain === "workingMemory") {
    analysis = { ...analysis, capacitySummary: analyzeCapacityTrials(trials) };
  }
  // 스토리형 인지적 유연성은 단계(색깔/모양/혼합)별 요약도 함께 저장합니다.
  if (version === "story" && domain === "flexibility") {
    analysis = { ...analysis, blockSummary: summarizeByBlock(trials) };
  }
  return settings ? { ...analysis, testSettings: settings } : analysis;
}

export interface SessionSummaryRow {
  id: string;
  participantId: string;
  participantName: string | null;
  ageYears: number | null;
  ageMonths: number | null;
  grade: string | null; // preschool | "1"~"6"
  ageGroup: string | null; // preschool | lower | upper
  testVersion: string; // standard | story
  task: EFDomain;
  date: string; // YYYY-MM-DD
  summary: Record<string, unknown> | null;
}

interface SessionSummaryDbRow {
  id: string;
  participant_id: string;
  participant_name: string | null;
  age_years: number | null;
  age_months: number | null;
  grade: string | null;
  age_group: string | null;
  test_version: string | null;
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
    .select("id, participant_id, participant_name, age_years, age_months, grade, age_group, test_version, task_type, started_at, summary")
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
    id: row.id,
    participantId: row.participant_id,
    participantName: row.participant_name,
    ageYears: row.age_years,
    ageMonths: row.age_months,
    grade: row.grade,
    ageGroup: row.age_group,
    testVersion: row.test_version ?? "standard",
    task: row.task_type,
    date: row.started_at?.slice(0, 10) ?? "",
    summary: row.summary,
  }));
}

// 선택한 검사 결과(세션)를 삭제합니다. 문항별 원자료(trials)는 DB 설정(on delete cascade)으로 함께 삭제됩니다.
// RLS 때문에 삭제 권한이 없으면 오류 없이 0건이 지워질 수 있어서, 실제로 지워진 개수를 돌려줍니다.
export async function deleteSessions(ids: string[]): Promise<{ deletedCount: number; error: string | null }> {
  if (!supabase) return { deletedCount: 0, error: "Supabase가 설정되어 있지 않습니다." };
  if (ids.length === 0) return { deletedCount: 0, error: null };

  const { data, error } = await supabase.from("test_sessions").delete().in("id", ids).select("id");
  if (error) return { deletedCount: 0, error: error.message };
  return { deletedCount: data?.length ?? 0, error: null };
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
// 스토리형 작업기억의 보급품 확인(기억 용량) 요약을 CSV에서 따로 읽을 수 있게 열로 풀어줍니다.
// 이 경우 overallAccuracy, maxSpanAchieved, meanResponseTime 등 기존 열은 "신호 기억(순서 기억)" 기준입니다.
function withCapacityColumns(summary: Record<string, unknown> | null): Record<string, unknown> | null {
  const capacity = summary?.capacitySummary as Record<string, unknown> | undefined;
  if (!summary || !capacity) return summary;
  return {
    ...summary,
    capacity_accuracy: capacity.accuracy,
    capacity_hitRate: capacity.hitRate,
    capacity_maxSizeAllCorrect: capacity.maxSizeAllCorrect,
    capacity_falsePicks: capacity.falsePicks,
    capacity_meanResponseTime: capacity.meanResponseTime,
    capacity_trials: capacity.totalTrials,
  };
}

export function buildSessionSummaryCsv(inputRows: SessionSummaryRow[]): string {
  const rows = inputRows.map((row) => ({ ...row, summary: withCapacityColumns(row.summary) }));
  const summaryKeys = new Set<string>();
  rows.forEach((row) => {
    if (row.summary) Object.keys(row.summary).forEach((key) => summaryKeys.add(key));
  });
  const orderedSummaryKeys = Array.from(summaryKeys).sort();

  const header = [
    "participantId",
    "name",
    "ageYears",
    "ageMonths",
    "grade",
    "ageGroup",
    "testVersion",
    "task",
    "date",
    ...orderedSummaryKeys,
  ];

  const lines = rows.map((row) => {
    const baseCells = [
      row.participantId,
      row.participantName ?? "",
      row.ageYears ?? "",
      row.ageMonths ?? "",
      row.grade ?? "",
      row.ageGroup ?? "",
      row.testVersion,
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
