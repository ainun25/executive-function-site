// 작업기억(시각적 순서 기억) 검사의 설정값과 문항 생성 로직입니다.
// 3x3 격자(9칸) 중 일부 칸이 순서대로 반짝이고, 학생은 같은 순서로 칸을 눌러 재현합니다.

export const GRID_SIZE = 9; // 3x3 격자

export interface WorkingMemoryConfig {
  startSpan: number; // 처음 시작하는 기억 길이 (예: 2개)
  maxSpan: number; // 도달할 수 있는 최대 길이
  itemDisplayMs: number; // 칸 하나가 반짝이는 시간
  itemGapMs: number; // 칸과 칸 사이 꺼져있는 시간
  maxAttemptsPerSpan: number; // 같은 길이에서 최대 시도 횟수 (모두 틀리면 검사 종료)
}

export const defaultWorkingMemoryConfig: WorkingMemoryConfig = {
  startSpan: 2,
  maxSpan: 6,
  itemDisplayMs: 800,
  itemGapMs: 350,
  maxAttemptsPerSpan: 2,
};

export const practiceWorkingMemoryConfig: WorkingMemoryConfig = {
  ...defaultWorkingMemoryConfig,
  maxSpan: 3,
};

// 9칸 중 중복 없이 span개를 무작위로 골라 순서를 만듭니다.
export function generateSequence(span: number): number[] {
  const positions = Array.from({ length: GRID_SIZE }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions.slice(0, span);
}
