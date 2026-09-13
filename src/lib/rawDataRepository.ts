import { supabase } from "./supabaseClient";
import type { EFDomain } from "@/types";

// 관리자/연구자용 원자료(raw data) 한 행의 데이터 구조 (섹션 14)
export interface RawDataRow {
  participantId: string;
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

interface TrialWithSession {
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
  test_sessions: {
    participant_id: string;
    started_at: string;
  } | null;
}

function toErrorType(trial: TrialWithSession): string {
  if (!trial.valid_trial) return `invalid:${trial.invalid_reason ?? "unknown"}`;
  if (trial.is_omission) return "omission";
  if (trial.is_commission_error) return "commission";
  return "";
}

export async function fetchRawDataRows(taskFilter: EFDomain | "all"): Promise<RawDataRow[]> {
  if (!supabase) return [];

  let query = supabase
    .from("trials")
    .select(
      "trial_number, task_type, condition, stimulus, user_answer, is_correct, reaction_time, is_omission, is_commission_error, valid_trial, invalid_reason, test_sessions(participant_id, started_at)"
    )
    .order("session_id", { ascending: false })
    .order("trial_number", { ascending: true })
    .limit(5000);

  if (taskFilter !== "all") {
    query = query.eq("task_type", taskFilter);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.warn("원자료를 불러오지 못했습니다:", error?.message);
    return [];
  }

  return (data as unknown as TrialWithSession[]).map((trial) => ({
    participantId: trial.test_sessions?.participant_id ?? "unknown",
    task: trial.task_type,
    trialNumber: trial.trial_number,
    condition: trial.condition,
    stimulus: trial.stimulus,
    answer: trial.user_answer,
    isCorrect: trial.is_correct,
    reactionTime: trial.reaction_time,
    errorType: toErrorType(trial),
    date: trial.test_sessions?.started_at?.slice(0, 10) ?? "",
  }));
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

// 섹션 14의 CSV 컬럼 형식: participantId, age, grade, task, trial, condition, stimulus, answer, correct, reactionTime, errorType, date
// age/grade는 아직 수집하지 않으므로 빈 값으로 둡니다 (섹션 17: 개인정보 최소 수집).
export function buildRawDataCsv(rows: RawDataRow[]): string {
  const header = [
    "participantId",
    "age",
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
      "",
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
