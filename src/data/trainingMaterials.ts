import { TrainingMaterial } from "@/types";

// PHASE 1 임시 예시 데이터입니다.
// 실제 서비스에서는 PHASE 8에서 관리자 페이지를 통해 등록/수정/삭제하게 됩니다.
export const sampleTrainingMaterials: TrainingMaterial[] = [
  {
    id: "sample-1",
    title: "멈춰! 신호등 게임",
    category: "inhibition",
    targetGrade: "초등 1~3학년",
    difficulty: "쉬움",
    durationMinutes: 10,
    description: "신호에 따라 움직이거나 멈추는 연습으로 억제통제를 길러주는 활동이에요.",
  },
  {
    id: "sample-2",
    title: "순서 기억 카드놀이",
    category: "workingMemory",
    targetGrade: "초등 2~4학년",
    difficulty: "보통",
    durationMinutes: 15,
    description: "카드의 순서를 기억했다가 다시 맞춰보는 놀이로 작업기억을 훈련해요.",
  },
  {
    id: "sample-3",
    title: "규칙 바꾸기 놀이",
    category: "flexibility",
    targetGrade: "초등 3~6학년",
    difficulty: "보통",
    durationMinutes: 15,
    description: "분류 규칙이 중간에 바뀌는 놀이를 통해 인지적 유연성을 연습해요.",
  },
];
