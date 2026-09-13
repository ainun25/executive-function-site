// 실행기능(Executive Function)의 3가지 핵심 영역
// 앞으로 검사, 훈련자료, 검색 등 모든 기능이 이 3영역을 기준으로 분류됩니다.
export type EFDomain = "inhibition" | "workingMemory" | "flexibility";

// "실행기능 알아보기" 페이지에서 보여줄 카드 하나의 데이터 구조
export interface EFDomainInfo {
  id: EFDomain;
  nameKo: string; // 한글 이름 (예: 억제통제)
  nameEn: string; // 영문 이름 (예: Inhibitory Control)
  concept: string; // 개념 설명
  examples: string[]; // 생활 속 예시
  learningRelation: string; // 학습과의 관계
  difficultySigns: string[]; // 어려움이 나타날 수 있는 모습
  color: string; // 카드 강조 색상 (tailwind 클래스 접두어)
}

// 실행기능 검사 3종류를 나타내는 카드 정보
export interface TestInfo {
  id: EFDomain;
  title: string;
  shortDescription: string;
  estimatedMinutes: number;
  color: string;
}

// 훈련자료 카테고리 (향후 관리자 등록 자료와 연결됨)
export type TrainingCategory = EFDomain | "combined"; // combined = 종합 활동

// 훈련자료 하나의 데이터 구조 (PHASE 8: 관리자가 등록/수정/삭제)
export interface TrainingMaterial {
  id: string;
  title: string;
  category: TrainingCategory;
  targetGrade: string; // 대상 학년 (예: "초등 3~4학년")
  difficulty: "쉬움" | "보통" | "어려움";
  durationMinutes: number;
  description: string;
  materials?: string | null; // 준비물
  activitySteps?: string | null; // 활동방법
  learningGoal?: string | null; // 교육 목표
  fileUrl?: string | null; // 워크시트/PDF/외부 링크 등
  source?: string | null; // 출처
}

// ---------------------------------------------------------------------------
// PHASE 8: 실행기능 찾아보기(검색)
// ---------------------------------------------------------------------------

export type ContentCategory = "concept" | "research" | "education" | "training" | "webResource";

// 검색 결과에 나타나는 자료 하나의 데이터 구조 (섹션 5)
export interface ContentItem {
  id: string;
  title: string;
  summary: string;
  category: ContentCategory;
  keywords: string[];
  source: string | null;
  author: string | null;
  year: number | null;
  url: string | null;
  createdAt: string; // ISO 문자열
}

// ---------------------------------------------------------------------------
// PHASE 2: 검사 공통 구조 (모든 검사가 공유하는 흐름과 데이터 구조)
// ---------------------------------------------------------------------------

// 검사 진행 단계. 모든 검사는 이 순서를 그대로 따릅니다.
// 검사 소개 → 연습 문제 → 연습 결과 확인 → "이제 시작합니다" → 본 검사 → 완료 → 결과 분석
export type TestPhase =
  | "intro"
  | "practice"
  | "practiceResult"
  | "ready"
  | "main"
  | "complete"
  | "result";

// 기기 종류 (반응시간 데이터 품질 검토용. 개인 식별용 fingerprinting이 아님)
export type DeviceType = "mobile" | "tablet" | "desktop";

// 한 문항(trial)마다 저장되는 데이터 구조.
// 세 검사(억제통제/작업기억/인지적 유연성)가 이 구조를 공통으로 사용하고,
// 검사별로 필요한 값만 채워 넣습니다 (예: 작업기억 검사는 isCommissionError를 쓰지 않음).
export interface TrialRecord {
  trialNumber: number;
  taskType: EFDomain;
  stimulus: string; // 제시된 자극 (이미지 파일명, 도형 이름 등)
  condition: string; // 시행 조건 (예: "go", "noGo", "repeat", "switch")
  correctAnswer: string | null;
  userAnswer: string | null;
  isCorrect: boolean | null;
  reactionTime: number | null; // 단위: ms (performance.now() 기준)
  isOmission: boolean; // 반응해야 하는데 반응하지 않음
  isCommissionError: boolean; // 반응하지 않아야 하는데 반응함
  timestamp: number; // 문항이 시작된 시각 (epoch ms)
  // 데이터 품질 관련 (섹션 24)
  validTrial: boolean;
  invalidReason: string | null; // 예: "tabHidden", "doubleResponse", "beforeStimulus"
  deviceType: DeviceType;
  browser: string;
  screenWidth: number;
  screenHeight: number;
}

// 한 번의 검사 세션 전체 요약 (검사 종료 후 결과 화면에서 사용)
export interface TestSessionSummary {
  taskType: EFDomain;
  startedAt: number;
  finishedAt: number;
  trials: TrialRecord[];
}
