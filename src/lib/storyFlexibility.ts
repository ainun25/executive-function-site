// 스토리형 인지적 유연성(3부 "규칙 변경") 결과를 단계별로 요약합니다.
// 단계는 표준형과 같은 블록입니다: 색깔 암호(colorBlock) → 모양 암호(shapeBlock) → 암호 뒤바뀜(mixed).

import type { TrialRecord } from "@/types";

export const STORY_FLEX_STAGES = [
  { block: "colorBlock", title: "1단계: 색깔 암호", note: "빨강 · 파랑으로 나누기" },
  { block: "shapeBlock", title: "2단계: 모양 암호", note: "원 · 세모로 나누기" },
  { block: "mixed", title: "3단계: 암호 뒤바뀜", note: "암호가 수시로 바뀌어요" },
] as const;

export interface BlockSummary {
  block: string;
  title: string;
  note: string;
  trials: number; // 유효 문항 수
  correct: number;
  accuracy: number | null; // %
  omissions: number; // 시간 안에 응답하지 못한 문항
  meanRT: number | null; // 맞은 문항의 평균 반응시간(ms)
}

export function summarizeByBlock(trials: TrialRecord[]): BlockSummary[] {
  const valid = trials.filter((t) => t.validTrial);
  return STORY_FLEX_STAGES.map((stage) => {
    const at = valid.filter((t) => t.condition.split(":")[0] === stage.block);
    const correct = at.filter((t) => t.isCorrect);
    const rts = correct.map((t) => t.reactionTime).filter((rt): rt is number => rt !== null);
    return {
      block: stage.block,
      title: stage.title,
      note: stage.note,
      trials: at.length,
      correct: correct.length,
      accuracy: at.length ? Math.round((correct.length / at.length) * 1000) / 10 : null,
      omissions: at.filter((t) => t.isOmission).length,
      meanRT: rts.length ? Math.round(rts.reduce((sum, v) => sum + v, 0) / rts.length) : null,
    };
  });
}
