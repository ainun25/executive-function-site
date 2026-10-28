// 스토리형 작업기억 2-A "보급품 확인"(기억 용량) 로직입니다.
// 물건 또는 숫자 몇 개가 "한꺼번에" 잠깐 보였다가 사라지고, 아래 후보 중에서 본 것을 모두 찾아 고릅니다.
// 순서를 기억하는 2-B "신호 기억"(SpanTask)과 달리 순서는 묻지 않고, 한 번에 몇 개를 기억하는지(용량)를 봅니다.
// ⚠️ 제시 시간과 개수는 과제 설계값일 뿐이며 연령별 표준값이 아닙니다(임시값).

import type { TrialRecord } from "@/types";

export type CapacityKind = "obj" | "num";

export interface CapacityPlanItem {
  size: number; // 한꺼번에 보여주는 개수
  kind: CapacityKind;
  shown: string[];
  options: string[]; // 보여준 것 + 헷갈리는 것(섞음)
}

const OBJECT_POOL = ["🍎", "🚀", "🔦", "🧭", "🔋", "🪐", "🛰️", "🎒", "🔑", "🧪", "🍌", "⭐"];
const NUMBER_POOL = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const CAPACITY_SIZES = [2, 3, 4, 5];
export const CAPACITY_DISTRACTORS = 4;

export function capacityShowMs(size: number): number {
  return 1500 + 700 * size;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeItem(size: number, kind: CapacityKind): CapacityPlanItem {
  const pool = shuffle(kind === "obj" ? OBJECT_POOL : NUMBER_POOL);
  const shown = pool.slice(0, size);
  const distractors = pool.slice(size, size + CAPACITY_DISTRACTORS);
  return { size, kind, shown, options: shuffle([...shown, ...distractors]) };
}

// 개수마다 물건 1문항, 숫자 1문항을 냅니다. (본 검사 8문항 / 연습 1문항)
export function generateCapacityPlan(mode: "practice" | "main"): CapacityPlanItem[] {
  if (mode === "practice") return [makeItem(2, "obj")];
  return CAPACITY_SIZES.flatMap((size) => [makeItem(size, "obj"), makeItem(size, "num")]);
}

export function isCapacityTrial(trial: TrialRecord): boolean {
  return trial.condition.startsWith("cap-");
}

function parseCondition(condition: string): { size: number; kind: CapacityKind } {
  const [sizePart, kind] = condition.replace("cap-", "").split(":");
  return { size: Number(sizePart) || 0, kind: kind === "num" ? "num" : "obj" };
}

function splitItems(value: string | null): string[] {
  return value ? value.split("|").filter((v) => v !== "") : [];
}

export interface CapacitySizeSummary {
  size: number;
  trials: number;
  allCorrect: number; // 본 것을 모두 맞게 고른 문항 수
  hits: number; // 찾아낸 물건 수
  shown: number; // 보여준 물건 수
  falsePicks: number; // 안 본 것을 고른 수
}

export interface CapacityAnalysis {
  totalTrials: number;
  accuracy: number; // % (모두 맞게 고른 문항 비율)
  hitRate: number; // % (보여준 물건 중 찾아낸 비율)
  maxSizeAllCorrect: number; // 한꺼번에 모두 맞게 찾은 가장 큰 개수
  falsePicks: number;
  meanResponseTime: number | null;
  perSize: CapacitySizeSummary[];
  perKind: { kind: CapacityKind; trials: number; accuracy: number }[];
}

export function analyzeCapacityTrials(trials: TrialRecord[]): CapacityAnalysis {
  const valid = trials.filter((t) => isCapacityTrial(t) && t.validTrial);

  const rows = valid.map((trial) => {
    const { size, kind } = parseCondition(trial.condition);
    const shown = splitItems(trial.correctAnswer);
    const chosen = splitItems(trial.userAnswer);
    const hits = chosen.filter((item) => shown.includes(item)).length;
    return { size, kind, hits, shown: shown.length, falsePicks: chosen.length - hits, correct: !!trial.isCorrect };
  });

  const sizes = Array.from(new Set(rows.map((r) => r.size))).sort((a, b) => a - b);
  const perSize = sizes.map((size) => {
    const at = rows.filter((r) => r.size === size);
    return {
      size,
      trials: at.length,
      allCorrect: at.filter((r) => r.correct).length,
      hits: at.reduce((sum, r) => sum + r.hits, 0),
      shown: at.reduce((sum, r) => sum + r.shown, 0),
      falsePicks: at.reduce((sum, r) => sum + r.falsePicks, 0),
    };
  });

  const perKind = (["obj", "num"] as CapacityKind[])
    .map((kind) => {
      const at = rows.filter((r) => r.kind === kind);
      return {
        kind,
        trials: at.length,
        accuracy: at.length ? Math.round((at.filter((r) => r.correct).length / at.length) * 1000) / 10 : 0,
      };
    })
    .filter((item) => item.trials > 0);

  const correctRows = rows.filter((r) => r.correct);
  const totalShown = rows.reduce((sum, r) => sum + r.shown, 0);
  const responseTimes = valid.map((t) => t.reactionTime).filter((rt): rt is number => rt !== null);

  return {
    totalTrials: trials.filter(isCapacityTrial).length,
    accuracy: rows.length ? Math.round((correctRows.length / rows.length) * 1000) / 10 : 0,
    hitRate: totalShown ? Math.round((rows.reduce((sum, r) => sum + r.hits, 0) / totalShown) * 1000) / 10 : 0,
    maxSizeAllCorrect: correctRows.length ? Math.max(...correctRows.map((r) => r.size)) : 0,
    falsePicks: rows.reduce((sum, r) => sum + r.falsePicks, 0),
    meanResponseTime: responseTimes.length
      ? Math.round(responseTimes.reduce((sum, v) => sum + v, 0) / responseTimes.length)
      : null,
    perSize,
    perKind,
  };
}
