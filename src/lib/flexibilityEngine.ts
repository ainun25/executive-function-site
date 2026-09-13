// 인지적 유연성(규칙 전환/Task Switching) 검사의 설정값과 문항 생성 로직입니다.
// 도형은 "색깔"과 "모양" 두 속성을 가지고, 현재 규칙에 따라 왼쪽/오른쪽 중 하나가 정답이 됩니다.

export type ShapeType = "circle" | "triangle";
export type ColorType = "red" | "blue";
export type RuleType = "color" | "shape";
export type BlockType = "colorBlock" | "shapeBlock" | "mixed";
export type SideAnswer = "left" | "right";

export interface FlexibilityStimulus {
  shape: ShapeType;
  color: ColorType;
}

export interface FlexibilityTrialSpec {
  block: BlockType;
  rule: RuleType;
  stimulus: FlexibilityStimulus;
}

export interface FlexibilityConfig {
  colorBlockTrials: number; // 색깔 규칙만 있는 첫 블록
  shapeBlockTrials: number; // 모양 규칙만 있는 두 번째 블록
  mixedBlockTrials: number; // 색깔/모양 규칙이 섞인 혼합 블록
  stimulusDurationMs: number; // 자극이 응답을 기다리는 최대 시간
  interTrialGapMs: number; // 다음 문항까지 대기 시간
}

export const defaultFlexibilityConfig: FlexibilityConfig = {
  colorBlockTrials: 8,
  shapeBlockTrials: 8,
  mixedBlockTrials: 24,
  stimulusDurationMs: 2500,
  interTrialGapMs: 400,
};

export const practiceFlexibilityConfig: FlexibilityConfig = {
  colorBlockTrials: 4,
  shapeBlockTrials: 4,
  mixedBlockTrials: 6,
  stimulusDurationMs: 2500,
  interTrialGapMs: 400,
};

function randomStimulus(): FlexibilityStimulus {
  return {
    shape: Math.random() < 0.5 ? "circle" : "triangle",
    color: Math.random() < 0.5 ? "red" : "blue",
  };
}

// 색깔 규칙: 빨강 → 왼쪽, 파랑 → 오른쪽 / 모양 규칙: 원 → 왼쪽, 세모 → 오른쪽
export function getCorrectAnswer(rule: RuleType, stimulus: FlexibilityStimulus): SideAnswer {
  if (rule === "color") return stimulus.color === "red" ? "left" : "right";
  return stimulus.shape === "circle" ? "left" : "right";
}

export function generateTrialSequence(config: FlexibilityConfig): FlexibilityTrialSpec[] {
  const sequence: FlexibilityTrialSpec[] = [];

  for (let i = 0; i < config.colorBlockTrials; i++) {
    sequence.push({ block: "colorBlock", rule: "color", stimulus: randomStimulus() });
  }
  for (let i = 0; i < config.shapeBlockTrials; i++) {
    sequence.push({ block: "shapeBlock", rule: "shape", stimulus: randomStimulus() });
  }

  const mixedRules: RuleType[] = Array.from({ length: config.mixedBlockTrials }, () =>
    Math.random() < 0.5 ? "color" : "shape"
  );
  const adjustedMixedRules = avoidLongRuns(mixedRules, 2);
  adjustedMixedRules.forEach((rule) => {
    sequence.push({ block: "mixed", rule, stimulus: randomStimulus() });
  });

  return sequence;
}

// 같은 규칙이 3번 이상 연속되지 않도록 조정 (혼합 블록에서 반복/전환이 고르게 섞이도록)
function avoidLongRuns(rules: RuleType[], maxRun: number): RuleType[] {
  const result = [...rules];
  for (let i = maxRun; i < result.length; i++) {
    const recentWindow = result.slice(i - maxRun, i);
    const isSameRun = recentWindow.every((rule) => rule === result[i]);
    if (isSameRun) {
      const swapIndex = result.findIndex((rule, idx) => idx > i && rule !== result[i]);
      if (swapIndex !== -1) {
        [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
      }
    }
  }
  return result;
}
