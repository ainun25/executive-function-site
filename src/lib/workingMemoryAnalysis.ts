import { TrialRecord } from "@/types";

export interface SpanAccuracy {
  span: number;
  trials: number;
  accuracy: number; // %
}

// 작업기억 검사 결과를 요약한 값들 (섹션 10)
export interface WorkingMemoryAnalysis {
  totalTrials: number;
  overallAccuracy: number; // %
  maxSpanAchieved: number; // 정답을 맞춘 가장 긴 span
  perSpanAccuracy: SpanAccuracy[];
  meanResponseTime: number | null; // ms
  orderErrorCount: number; // 고른 칸은 맞지만 순서가 틀림
  itemErrorCount: number; // 고른 칸 자체가 틀림 (누락 포함)
}

function parseSpanFromCondition(condition: string): number {
  return Number(condition.replace("span-", "")) || 0;
}

function parseSequence(value: string | null): number[] {
  if (!value) return [];
  return value
    .split("-")
    .filter((v) => v !== "")
    .map(Number);
}

export function analyzeWorkingMemoryTrials(trials: TrialRecord[]): WorkingMemoryAnalysis {
  const validTrials = trials.filter((trial) => trial.validTrial);
  const correctTrials = validTrials.filter((trial) => trial.isCorrect);

  const maxSpanAchieved = correctTrials.length
    ? Math.max(...correctTrials.map((trial) => parseSpanFromCondition(trial.condition)))
    : 0;

  const spanNumbers = Array.from(
    new Set(validTrials.map((trial) => parseSpanFromCondition(trial.condition)))
  ).sort((a, b) => a - b);

  const perSpanAccuracy: SpanAccuracy[] = spanNumbers.map((span) => {
    const trialsAtSpan = validTrials.filter((trial) => parseSpanFromCondition(trial.condition) === span);
    const correctAtSpan = trialsAtSpan.filter((trial) => trial.isCorrect).length;
    return {
      span,
      trials: trialsAtSpan.length,
      accuracy: trialsAtSpan.length ? Math.round((correctAtSpan / trialsAtSpan.length) * 1000) / 10 : 0,
    };
  });

  let orderErrorCount = 0;
  let itemErrorCount = 0;
  validTrials.forEach((trial) => {
    if (trial.isCorrect) return;
    const correctSeq = parseSequence(trial.correctAnswer);
    const userSeq = parseSequence(trial.userAnswer);
    const sameSet =
      correctSeq.length === userSeq.length &&
      [...correctSeq].sort().join(",") === [...userSeq].sort().join(",");
    if (sameSet) {
      orderErrorCount += 1;
    } else {
      itemErrorCount += 1;
    }
  });

  const responseTimes = validTrials
    .map((trial) => trial.reactionTime)
    .filter((rt): rt is number => rt !== null);

  return {
    totalTrials: trials.length,
    overallAccuracy: validTrials.length
      ? Math.round((correctTrials.length / validTrials.length) * 1000) / 10
      : 0,
    maxSpanAchieved,
    perSpanAccuracy,
    meanResponseTime: responseTimes.length
      ? Math.round(responseTimes.reduce((sum, v) => sum + v, 0) / responseTimes.length)
      : null,
    orderErrorCount,
    itemErrorCount,
  };
}
