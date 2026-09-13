import { TrialRecord } from "@/types";

// 억제통제 검사 결과를 요약한 값들 (섹션 9)
export interface InhibitionAnalysis {
  totalTrials: number;
  validTrialCount: number;
  overallAccuracy: number; // %
  goAccuracy: number; // %
  noGoAccuracy: number; // %
  meanRT: number | null; // ms, GO 문항 중 실제 응답한 것만
  medianRT: number | null;
  sdRT: number | null;
  minRT: number | null;
  maxRT: number | null;
  omissionCount: number; // 반응해야 하는데 반응하지 않음
  commissionCount: number; // 반응하지 않아야 하는데 반응함
  anticipatoryCount: number; // 지나치게 빠른 반응 (threshold 미만)
}

export function analyzeInhibitionTrials(
  trials: TrialRecord[],
  anticipatoryThresholdMs: number
): InhibitionAnalysis {
  const validTrials = trials.filter((trial) => trial.validTrial);
  const goTrials = validTrials.filter((trial) => trial.condition === "go");
  const noGoTrials = validTrials.filter((trial) => trial.condition === "noGo");

  const correctCount = validTrials.filter((trial) => trial.isCorrect).length;
  const goCorrectCount = goTrials.filter((trial) => trial.isCorrect).length;
  const noGoCorrectCount = noGoTrials.filter((trial) => trial.isCorrect).length;

  const goReactionTimes = goTrials
    .filter((trial) => trial.reactionTime !== null)
    .map((trial) => trial.reactionTime as number);

  return {
    totalTrials: trials.length,
    validTrialCount: validTrials.length,
    overallAccuracy: toPercent(correctCount, validTrials.length),
    goAccuracy: toPercent(goCorrectCount, goTrials.length),
    noGoAccuracy: toPercent(noGoCorrectCount, noGoTrials.length),
    meanRT: mean(goReactionTimes),
    medianRT: median(goReactionTimes),
    sdRT: standardDeviation(goReactionTimes),
    minRT: goReactionTimes.length ? Math.min(...goReactionTimes) : null,
    maxRT: goReactionTimes.length ? Math.max(...goReactionTimes) : null,
    omissionCount: validTrials.filter((trial) => trial.isOmission).length,
    commissionCount: validTrials.filter((trial) => trial.isCommissionError).length,
    anticipatoryCount: goReactionTimes.filter((rt) => rt < anticipatoryThresholdMs).length,
  };
}

function toPercent(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function standardDeviation(values: number[]): number | null {
  if (values.length < 2) return null;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.round(Math.sqrt(variance));
}
