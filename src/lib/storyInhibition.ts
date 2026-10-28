import type { TrialRecord } from "@/types";

// 스토리형 억제통제 검사 "지구 수호대 작전 1부: 요원 선별"의 단계 정의와 단계별 요약입니다.
// 본검사는 설정(문항 수 등)은 표준형과 같고, 문항을 3단계(행성/UFO/요원)로 나눠 진행합니다.

export type StoryStageId = "planet" | "ufo" | "agent";

export interface StoryStage {
  id: StoryStageId;
  title: string;
  story: string;
  cue: string; // 색 외에 아군/적군을 구분하는 모양 단서 설명
  visual: 1 | 2 | 3; // EarthGuardStimulus의 level
}

export const STORY_STAGES: StoryStage[] = [
  {
    id: "planet",
    title: "1단계: 행성 수호",
    story: "우리 행성이 다가오고 있어요!",
    cue: "아군 행성은 고리가 있고, 적군 행성은 뾰족한 가시가 있어요.",
    visual: 1,
  },
  {
    id: "ufo",
    title: "2단계: UFO 확인",
    story: "엔진 불꽃을 확인해요!",
    cue: "아군 UFO는 동그란 불꽃, 적군 UFO는 뾰족한 불꽃이에요.",
    visual: 2,
  },
  {
    id: "agent",
    title: "3단계: 요원 선별",
    story: "변장한 적군 요원을 찾아요!",
    cue: "적군 요원은 검은 고글을 쓰고 있어요.",
    visual: 3,
  },
];

// 전체 문항 수를 단계 수로 나눕니다 (나머지는 앞 단계부터 1개씩). 합계는 항상 전체 문항 수와 같습니다.
export function splitTrialCounts(total: number, stageCount = 3): number[] {
  const base = Math.floor(total / stageCount);
  const remainder = total % stageCount;
  return Array.from({ length: stageCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

// 문항 기록의 stimulus는 "단계:아군|적군" 형태(예: "planet:ally")로 저장됩니다.
export function makeStimulusLabel(stage: StoryStageId, isAlly: boolean): string {
  return `${stage}:${isAlly ? "ally" : "enemy"}`;
}

export interface StageSummary {
  stage: StoryStageId;
  title: string;
  trials: number;
  allyTotal: number;
  allyHits: number; // 아군에게 반응한 횟수
  enemyTotal: number;
  enemyHolds: number; // 적군에게 반응하지 않고 참은 횟수
  omissions: number; // 아군인데 반응하지 못함
  commissions: number; // 적군인데 반응함
  meanRT: number | null; // 아군에게 반응한 문항의 평균 반응시간(ms)
  allyHitRate: number | null; // %
  enemyHoldRate: number | null; // %
}

function toRate(count: number, total: number): number | null {
  return total === 0 ? null : Math.round((count / total) * 1000) / 10;
}

// 유효한 문항만 단계별로 요약합니다.
export function summarizeByStage(trials: TrialRecord[]): StageSummary[] {
  const validTrials = trials.filter((trial) => trial.validTrial);

  return STORY_STAGES.map((stage) => {
    const stageTrials = validTrials.filter((trial) => trial.stimulus.startsWith(`${stage.id}:`));
    const ally = stageTrials.filter((trial) => trial.condition === "go");
    const enemy = stageTrials.filter((trial) => trial.condition === "noGo");
    const allyHitTrials = ally.filter((trial) => trial.isCorrect);
    const reactionTimes = allyHitTrials
      .map((trial) => trial.reactionTime)
      .filter((rt): rt is number => rt !== null);

    return {
      stage: stage.id,
      title: stage.title,
      trials: stageTrials.length,
      allyTotal: ally.length,
      allyHits: allyHitTrials.length,
      enemyTotal: enemy.length,
      enemyHolds: enemy.filter((trial) => trial.isCorrect).length,
      omissions: ally.filter((trial) => trial.isOmission).length,
      commissions: enemy.filter((trial) => trial.isCommissionError).length,
      meanRT: reactionTimes.length
        ? Math.round(reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length)
        : null,
      allyHitRate: toRate(allyHitTrials.length, ally.length),
      enemyHoldRate: toRate(enemy.filter((trial) => trial.isCorrect).length, enemy.length),
    };
  });
}
