import { EFDomainInfo, TestInfo } from "@/types";

// "실행기능 알아보기" 페이지에서 사용하는 3대 핵심 실행기능 설명 데이터
export const efDomains: EFDomainInfo[] = [
  {
    id: "inhibition",
    nameKo: "억제통제",
    nameEn: "Inhibitory Control",
    concept:
      "자동적으로 하려는 행동이나 충동을 멈추고, 그 대신 필요한 행동을 선택하는 능력입니다.",
    examples: [
      "하고 싶은 말을 잠깐 멈추기",
      "게임을 더 하고 싶어도 약속된 시간에 멈추기",
      "방해 자극을 무시하고 필요한 것에 집중하기",
    ],
    learningRelation:
      "수업 중 충동적으로 발언하거나 행동하지 않고, 필요한 순간까지 기다리는 데 도움을 줍니다.",
    difficultySigns: [
      "순서를 기다리지 못함",
      "생각 없이 즉각 행동하거나 말함",
      "주변 자극에 쉽게 산만해짐",
    ],
    color: "indigo",
  },
  {
    id: "workingMemory",
    nameKo: "작업기억",
    nameEn: "Working Memory",
    concept:
      "필요한 정보를 잠시 머릿속에 유지하면서 동시에 사용하는 능력입니다.",
    examples: ["여러 단계의 지시 기억하기", "암산하기", "읽은 내용을 기억하며 다음 내용을 이해하기"],
    learningRelation:
      "여러 단계로 된 지시를 따르거나, 문제를 풀며 이전 단계의 정보를 유지하는 데 필요합니다.",
    difficultySigns: [
      "여러 단계 지시를 끝까지 따르지 못함",
      "방금 들은 내용을 금방 잊어버림",
      "긴 문제 풀이 중간에 앞부분을 잊음",
    ],
    color: "indigo",
  },
  {
    id: "flexibility",
    nameKo: "인지적 유연성",
    nameEn: "Cognitive Flexibility",
    concept: "상황이나 규칙이 바뀌었을 때 생각이나 행동을 유연하게 바꿀 수 있는 능력입니다.",
    examples: [
      "다른 해결 방법 찾기",
      "규칙이 바뀌었을 때 새로운 규칙 적용하기",
      "자신의 생각과 다른 관점 고려하기",
    ],
    learningRelation:
      "문제 해결 방법이 통하지 않을 때 다른 전략으로 바꾸거나, 새로운 규칙에 적응하는 데 도움을 줍니다.",
    difficultySigns: [
      "한 가지 방법을 고집함",
      "규칙이 바뀌면 크게 혼란스러워함",
      "다른 사람의 관점을 받아들이기 어려워함",
    ],
    color: "indigo",
  },
];

// EFDomain id를 실제 검사 소개 페이지 경로로 변환 (working-memory는 하이픈 사용)
export const testRoutes: Record<string, string> = {
  inhibition: "/tests/inhibition",
  workingMemory: "/tests/working-memory",
  flexibility: "/tests/flexibility",
};

// "실행기능 검사" 메뉴에서 보여줄 3개 검사 카드 정보
export const testInfos: TestInfo[] = [
  {
    id: "inhibition",
    title: "억제통제 검사",
    shortDescription: "화면에 나오는 동물 그림을 보고, 규칙에 따라 반응하거나 멈추는 과제예요.",
    estimatedMinutes: 8,
    color: "indigo",
  },
  {
    id: "workingMemory",
    title: "작업기억 검사",
    shortDescription: "순서대로 나타나는 그림을 잘 기억했다가 똑같은 순서로 골라보는 과제예요.",
    estimatedMinutes: 8,
    color: "indigo",
  },
  {
    id: "flexibility",
    title: "인지적 유연성 검사",
    shortDescription: "바뀌는 규칙에 맞춰 도형을 분류하는 과제예요.",
    estimatedMinutes: 8,
    color: "indigo",
  },
];
