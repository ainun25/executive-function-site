// 억제통제(Go/No-Go) 검사의 설정값과 문항 순서를 만드는 로직입니다.
// totalTrials 등은 이후 관리자 페이지(PHASE 8)에서 값을 바꿀 수 있도록
// 하나의 설정 객체(InhibitionConfig)로 분리해 두었습니다.

export type InhibitionCondition = "go" | "noGo";

export interface InhibitionConfig {
  totalTrials: number;
  goRatio: number; // 전체 중 GO 문항 비율 (0~1)
  fixationMs: number; // 자극 제시 전 "+" 표시 시간
  stimulusDurationMs: number; // 자극이 화면에 떠있는 최대 시간
  interTrialGapMs: number; // 다음 문항으로 넘어가기 전 대기 시간
  anticipatoryThresholdMs: number; // 이보다 빠른 반응은 anticipatory response로 표시
}

export const defaultInhibitionConfig: InhibitionConfig = {
  totalTrials: 40,
  goRatio: 0.7,
  fixationMs: 500,
  stimulusDurationMs: 1000,
  interTrialGapMs: 400,
  anticipatoryThresholdMs: 150,
};

export const practiceInhibitionConfig: InhibitionConfig = {
  ...defaultInhibitionConfig,
  totalTrials: 8,
};

// GO/NO-GO 조건을 비율에 맞게 섞은 뒤, 같은 조건이 4번 이상 연속되지 않도록 조정합니다.
export function generateTrialSequence(config: InhibitionConfig): InhibitionCondition[] {
  const goCount = Math.round(config.totalTrials * config.goRatio);
  const noGoCount = config.totalTrials - goCount;
  const sequence: InhibitionCondition[] = [
    ...Array(goCount).fill("go"),
    ...Array(noGoCount).fill("noGo"),
  ];

  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }

  return avoidLongRuns(sequence, 3);
}

function avoidLongRuns(sequence: InhibitionCondition[], maxRun: number): InhibitionCondition[] {
  const result = [...sequence];
  for (let i = maxRun; i < result.length; i++) {
    const recentWindow = result.slice(i - maxRun, i);
    const isSameRun = recentWindow.every((condition) => condition === result[i]);
    if (isSameRun) {
      const swapIndex = result.findIndex((condition, idx) => idx > i && condition !== result[i]);
      if (swapIndex !== -1) {
        [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
      }
    }
  }
  return result;
}
