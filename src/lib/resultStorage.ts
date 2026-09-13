"use client";

import { EFDomain, TestSessionSummary, TrialRecord } from "@/types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getParticipantId } from "./participant";

// 결과 저장 방식:
// 1) 항상 이 브라우저의 localStorage에 저장합니다 (데모 모드, 섹션 17 - 서버 없이도 결과 확인 가능).
// 2) Supabase 환경변수(.env.local)가 설정되어 있으면, 추가로 데이터베이스에도 저장합니다 (PHASE 7).
//    Supabase 저장에 실패해도 localStorage 저장/화면 표시에는 영향이 없습니다.
const STORAGE_KEY_PREFIX = "ef-site:result:";

const ALL_DOMAINS: EFDomain[] = ["inhibition", "workingMemory", "flexibility"];

export function saveTestResult(domain: EFDomain, trials: TrialRecord[]): void {
  if (typeof window === "undefined" || trials.length === 0) return;
  const summary: TestSessionSummary = {
    taskType: domain,
    startedAt: trials[0].timestamp,
    finishedAt: Date.now(),
    trials,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY_PREFIX + domain, JSON.stringify(summary));
  } catch {
    // 저장 공간이 없거나 접근할 수 없어도 검사 자체는 계속 진행되어야 하므로 조용히 무시합니다.
  }

  if (isSupabaseConfigured) {
    void syncResultToSupabase(domain, summary);
  }
}

async function syncResultToSupabase(domain: EFDomain, summary: TestSessionSummary): Promise<void> {
  if (!supabase) return;
  try {
    const participantId = getParticipantId();
    const firstTrial = summary.trials[0];

    const { data: sessionRow, error: sessionError } = await supabase
      .from("test_sessions")
      .insert({
        participant_id: participantId,
        task_type: domain,
        started_at: new Date(summary.startedAt).toISOString(),
        finished_at: new Date(summary.finishedAt).toISOString(),
        device_type: firstTrial.deviceType,
        browser: firstTrial.browser,
        screen_width: firstTrial.screenWidth,
        screen_height: firstTrial.screenHeight,
      })
      .select("id")
      .single();

    if (sessionError || !sessionRow) {
      console.warn("Supabase 세션 저장 실패 (localStorage 결과는 정상 저장됨):", sessionError?.message);
      return;
    }

    const trialRows = summary.trials.map((trial) => ({
      session_id: sessionRow.id,
      trial_number: trial.trialNumber,
      task_type: trial.taskType,
      stimulus: trial.stimulus,
      condition: trial.condition,
      correct_answer: trial.correctAnswer,
      user_answer: trial.userAnswer,
      is_correct: trial.isCorrect,
      reaction_time: trial.reactionTime,
      is_omission: trial.isOmission,
      is_commission_error: trial.isCommissionError,
      trial_timestamp: trial.timestamp,
      valid_trial: trial.validTrial,
      invalid_reason: trial.invalidReason,
    }));

    const { error: trialsError } = await supabase.from("trials").insert(trialRows);
    if (trialsError) {
      console.warn("Supabase 문항 저장 실패 (localStorage 결과는 정상 저장됨):", trialsError.message);
    }
  } catch (error) {
    console.warn("Supabase 저장 중 오류 (localStorage 결과는 정상 저장됨):", error);
  }
}

export function loadTestResult(domain: EFDomain): TestSessionSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + domain);
    return raw ? (JSON.parse(raw) as TestSessionSummary) : null;
  } catch {
    return null;
  }
}

export function loadAllTestResults(): Record<EFDomain, TestSessionSummary | null> {
  return {
    inhibition: loadTestResult("inhibition"),
    workingMemory: loadTestResult("workingMemory"),
    flexibility: loadTestResult("flexibility"),
  };
}

export function clearAllResults(): void {
  if (typeof window === "undefined") return;
  ALL_DOMAINS.forEach((domain) => {
    window.localStorage.removeItem(STORAGE_KEY_PREFIX + domain);
  });
}
