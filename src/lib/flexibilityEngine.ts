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
  announce: boolean; // 이 문항 앞에서 규칙을 한 번 안내할지 (블록의 첫 문항, 규칙이 바뀌는 문항)
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

// 혼합 블록: 규칙이 "연속 → 전환 → 연속 → 전환"으로 이어지다가, 마지막에만 짧게 자주 바뀝니다.
//  - 앞쪽 약 2/3: 같은 규칙이 4번씩 이어집니다
//  - 뒤쪽 약 1/3: 같은 규칙이 2번씩 이어집니다
// 규칙이 바뀔 때 안내 화면을 한 번 보여주고, 문항이 진행되는 동안에는 규칙 단서를 따로 주지 않습니다.
// 직전 블록(모양 규칙)에 이어 색깔 규칙부터 시작해 첫 문항에서 규칙이 바뀝니다.
export const LONG_RUN_LENGTH = 4;
export const SHORT_RUN_LENGTH = 2;

export function planMixedRuns(total: number): number[] {
  const longTarget = Math.ceil((total * 2) / 3);
  const runs: number[] = [];
  let used = 0;
  while (used < longTarget) {
    const length = Math.min(LONG_RUN_LENGTH, total - used);
    runs.push(length);
    used += length;
  }
  while (used < total) {
    const length = Math.min(SHORT_RUN_LENGTH, total - used);
    runs.push(length);
    used += length;
  }
  return runs;
}

export function generateTrialSequence(config: FlexibilityConfig): FlexibilityTrialSpec[] {
  const sequence: FlexibilityTrialSpec[] = [];

  for (let i = 0; i < config.colorBlockTrials; i++) {
    sequence.push({ block: "colorBlock", rule: "color", stimulus: randomStimulus(), announce: i === 0 });
  }
  for (let i = 0; i < config.shapeBlockTrials; i++) {
    sequence.push({ block: "shapeBlock", rule: "shape", stimulus: randomStimulus(), announce: i === 0 });
  }

  let rule: RuleType = "color";
  planMixedRuns(config.mixedBlockTrials).forEach((runLength) => {
    for (let i = 0; i < runLength; i++) {
      sequence.push({
        block: "mixed",
        rule,
        stimulus: randomStimulus(),
        announce: i === 0,
      });
    }
    rule = rule === "color" ? "shape" : "color";
  });

  return sequence;
}
