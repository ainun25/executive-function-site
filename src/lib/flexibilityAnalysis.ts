import { TrialRecord } from "@/types";

// 인지적 유연성 검사 결과를 요약한 값들 (섹션 11)
// switch cost는 혼합 블록(mixed) 안에서 반복(repeat) trial과 전환(switch) trial을 비교해 계산합니다.
export interface FlexibilityAnalysis {
  totalTrials: number;
  validTrialCount: number;
  overallAccuracy: number; // %
  repeatAccuracy: number; // 혼합 블록 반복 trial 정확도(%)
  switchAccuracy: number; // 혼합 블록 전환 trial 정확도(%)
  repeatMeanRT: number | null;
  switchMeanRT: number | null;
  switchCostRT: number | null; // 전환 평균RT - 반복 평균RT
  switchCostAccuracy: number | null; // 반복 정확도 - 전환 정확도
}

function parseCondition(condition: string): { block: string; transition: "repeat" | "switch" } {
  const [block, transition] = condition.split(":");
  return { block, transition: transition === "switch" ? "switch" : "repeat" };
}

export function analyzeFlexibilityTrials(trials: TrialRecord[]): FlexibilityAnalysis {
  const validTrials = trials.filter((trial) => trial.validTrial);
  const mixedTrials = validTrials.filter((trial) => parseCondition(trial.condition).block === "mixed");

  const repeatTrials = mixedTrials.filter(
    (trial) => parseCondition(trial.condition).transition === "repeat"
  );
  const switchTrials = mixedTrials.filter(
    (trial) => parseCondition(trial.condition).transition === "switch"
  );

  const correctCount = validTrials.filter((trial) => trial.isCorrect).length;
  const repeatCorrectCount = repeatTrials.filter((trial) => trial.isCorrect).length;
  const switchCorrectCount = switchTrials.filter((trial) => trial.isCorrect).length;

  const repeatRTs = repeatTrials
    .filter((trial) => trial.reactionTime !== null)
    .map((trial) => trial.reactionTime as number);
  const switchRTs = switchTrials
    .filter((trial) => trial.reactionTime !== null)
    .map((trial) => trial.reactionTime as number);

  const repeatAccuracy = toPercent(repeatCorrectCount, repeatTrials.length);
  const switchAccuracy = toPercent(switchCorrectCount, switchTrials.length);
  const repeatMeanRT = mean(repeatRTs);
  const switchMeanRT = mean(switchRTs);

  return {
    totalTrials: trials.length,
    validTrialCount: validTrials.length,
    overallAccuracy: toPercent(correctCount, validTrials.length),
    repeatAccuracy,
    switchAccuracy,
    repeatMeanRT,
    switchMeanRT,
    switchCostRT:
      repeatMeanRT !== null && switchMeanRT !== null ? switchMeanRT - repeatMeanRT : null,
    switchCostAccuracy:
      repeatTrials.length && switchTrials.length
        ? Math.round((repeatAccuracy - switchAccuracy) * 10) / 10
        : null,
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
