import { supabase } from "./supabaseClient";
import type { EFDomain } from "@/types";

// 관리자/연구자용 원자료(raw data) 한 행의 데이터 구조 (섹션 14)
// participantName/age는 실제 개인정보이므로, 이 함수는 관리자 페이지에서만 호출되어야 합니다
// (Supabase 쪽에서도 로그인한 사람만 조회 가능하도록 RLS로 제한되어 있습니다 - phase10_schema.sql).
export interface RawDataRow {
  participantId: string;
  participantName: string | null;
  ageYears: number | null;
  ageMonths: number | null;
  task: EFDomain;
  trialNumber: number;
  condition: string | null;
  stimulus: string | null;
  answer: string | null;
  isCorrect: boolean | null;
  reactionTime: number | null;
  errorType: string; // "omission" | "commission" | "invalid:이유" | "" (정답)
  date: string; // YYYY-MM-DD (세션 시작일 기준)
}

interface TrialRow {
  trial_number: number;
  task_type: EFDomain;
  condition: string | null;
  stimulus: string | null;
  user_answer: string | null;
  is_correct: boolean | null;
  reaction_time: number | null;
  is_omission: boolean;
  is_commission_error: boolean;
  valid_trial: boolean;
  invalid_reason: string | null;
}

interface SessionWithTrials {
  participant_id: string;
  participant_name: string | null;
  age_years: number | null;
  age_months: number | null;
  started_at: string;
  trials: TrialRow[];
}

function toErrorType(trial: TrialRow): string {
  if (!trial.valid_trial) return `invalid:${trial.invalid_reason ?? "unknown"}`;
  if (trial.is_omission) return "omission";
  if (trial.is_commission_error) return "commission";
  return "";
}

export async function fetchRawDataRows(taskFilter: EFDomain | "all"): Promise<RawDataRow[]> {
  if (!supabase) return [];

  // trials가 아니라 test_sessions를 기준 테이블로 조회해야 "최신 검사 순" 정렬이 실제로 적용됩니다.
  // (PostgREST에서 관련 테이블 기준 정렬은 "부모" 테이블 순서에는 영향을 주지 않습니다.)
  let query = supabase
    .from("test_sessions")
    .select(
      "participant_id, participant_name, age_years, age_months, started_at, task_type, trials(trial_number, task_type, condition, stimulus, user_answer, is_correct, reaction_time, is_omission, is_commission_error, valid_trial, invalid_reason)"
    )
    .order("started_at", { ascending: false })
    .order("trial_number", { referencedTable: "trials", ascending: true })
    .limit(500);

  if (taskFilter !== "all") {
    query = query.eq("task_type", taskFilter);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.warn("원자료를 불러오지 못했습니다:", error?.message);
    return [];
  }

  const rows: RawDataRow[] = [];
  (data as unknown as SessionWithTrials[]).forEach((session) => {
    session.trials.forEach((trial) => {
      rows.push({
        participantId: session.participant_id,
        participantName: session.participant_name,
        ageYears: session.age_years,
        ageMonths: session.age_months,
        task: trial.task_type,
        trialNumber: trial.trial_number,
        condition: trial.condition,
        stimulus: trial.stimulus,
        answer: trial.user_answer,
        isCorrect: trial.is_correct,
        reactionTime: trial.reaction_time,
        errorType: toErrorType(trial),
        date: session.started_at?.slice(0, 10) ?? "",
      });
    });
  });

  return rows;
}

// CSV 한 셀에 쉼표/줄바꿈/따옴표가 있으면 안전하게 감싸줍니다.
function escapeCsvCell(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

// 섹션 14의 CSV 컬럼 형식에 name/ageYears/ageMonths를 추가로 포함합니다.
// grade(학년)는 아직 수집하지 않으므로 빈 값으로 둡니다.
// ⚠️ 이 CSV에는 실명이 포함되므로, 다운로드한 파일은 안전하게 보관/관리해야 합니다.
export function buildRawDataCsv(rows: RawDataRow[]): string {
  const header = [
    "participantId",
    "name",
    "ageYears",
    "ageMonths",
    "grade",
    "task",
    "trial",
    "condition",
    "stimulus",
    "answer",
    "correct",
    "reactionTime",
    "errorType",
    "date",
  ];

  const lines = rows.map((row) =>
    [
      row.participantId,
      row.participantName ?? "",
      row.ageYears ?? "",
      row.ageMonths ?? "",
      "",
      row.task,
      row.trialNumber,
      row.condition,
      row.stimulus,
      row.answer,
      row.isCorrect === null ? "" : row.isCorrect ? "TRUE" : "FALSE",
      row.reactionTime ?? "",
      row.errorType,
      row.date,
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  // 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM을 앞에 붙입니다.
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
