// 실행기능 놀이(훈련) 게임 목록과 진도(별) 저장입니다.
// 놀이는 "검사"가 아니므로 정답을 바로 알려주고, 결과는 이 기기에 별 개수만 저장합니다(이름/점수는 서버로 보내지 않음).

import type { EFDomain } from "@/types";

export type GameId = "brake" | "piano" | "cave";
export type GameLevel = 1 | 2 | 3;
export const GAME_LEVELS: GameLevel[] = [1, 2, 3];

export interface GameInfo {
  id: GameId;
  domain: EFDomain;
  title: string;
  icon: string;
  tagline: string;
  sceneEmoji: string;
  sceneText: string; // 시작 장면(한두 줄)
  commanderLine: string; // 게임 설명을 해주는 대장(안내자) 대사
  howTo: string[];
  levelNames: Record<GameLevel, string>;
  levelDescs: Record<GameLevel, string>;
  route: string;
}

export const GAMES: GameInfo[] = [
  {
    id: "brake",
    domain: "inhibition",
    title: "꼬마 자동차 브레이크",
    icon: "🚗",
    tagline: "페달을 꾹 밟고 달리다가, 빨간불에서 멈춰요!",
    sceneEmoji: "🛣️",
    sceneText: "꼬마 자동차 마을에 아침이 밝았어요. 오늘은 내가 운전사! 길 위에는 신호등과 공사 표지판이 있어요.",
    commanderLine: "운전사님, 안전하게 달리려면 멈출 때를 알아야 해요!",
    howTo: [
      "🦶 페달을 꾹 누르고 있으면 자동차가 달려요.",
      "🛑 빨간불·공사 표지판이 나오면 얼른 손을 떼서 멈춰요.",
      "🟢 초록불이나 나무가 나오면 손을 떼지 말고 계속 달려요.",
    ],
    levelNames: { 1: "1단계 · 아침 동네길", 2: "2단계 · 낮 시내길", 3: "3단계 · 저녁 고속도로" },
    levelDescs: {
      1: "예비초등 · 천천히, 신호가 크게 나와요",
      2: "초등 저학년 · 가짜 신호도 나와요",
      3: "초등 고학년 · 빠르고 헷갈리는 신호가 나와요",
    },
    route: "/training/play/brake",
  },
  {
    id: "piano",
    domain: "workingMemory",
    title: "마법 피아노",
    icon: "🎹",
    tagline: "빛과 소리의 순서를 기억해서 따라 쳐요!",
    sceneEmoji: "🌙",
    sceneText: "깊은 밤, 숲속 마법 피아노가 혼자 반짝이기 시작했어요. 순서대로 연주하면 숲의 비밀 문이 열린대요!",
    commanderLine: "마법사님, 피아노가 알려주는 순서를 잘 기억해 주세요!",
    howTo: [
      "👀 건반이 하나씩 반짝이고 소리가 나요. 순서를 잘 기억해요.",
      "👆 반짝임이 끝나면 같은 순서로 건반을 눌러요.",
      "⬅️ 3단계에서는 거꾸로(마지막 건반부터) 눌러요!",
    ],
    levelNames: { 1: "1단계 · 별빛 건반", 2: "2단계 · 달빛 건반", 3: "3단계 · 거꾸로 마법" },
    levelDescs: {
      1: "예비초등 · 건반 4개, 짧은 순서",
      2: "초등 저학년 · 건반 5개, 조금 더 긴 순서",
      3: "초등 고학년 · 거꾸로 눌러요",
    },
    route: "/training/play/piano",
  },
  {
    id: "cave",
    domain: "flexibility",
    title: "조건에 맞는 동굴 항해",
    icon: "⛵",
    tagline: "항해 지도의 규칙에 맞는 동굴로 배를 몰아요!",
    sceneEmoji: "🌊",
    sceneText: "작은 배를 타고 보물 섬으로 가는 길, 동굴이 여러 개 나타났어요. 하지만 항해 지도의 규칙이 가끔 바뀐대요!",
    commanderLine: "선장님, 지도에 적힌 규칙에 딱 맞는 동굴로 들어가야 해요!",
    howTo: [
      "🗺️ 위에 지도 그림이 나와요. 지금 규칙(색깔·모양·개수)을 확인해요.",
      "⛵ 지도와 규칙이 같은 동굴을 눌러요.",
      "🌪️ 폭풍이 오면 규칙이 바뀌어요! 새 규칙을 잘 기억해요.",
    ],
    levelNames: { 1: "1단계 · 잔잔한 바다", 2: "2단계 · 안개 바다", 3: "3단계 · 폭풍 바다" },
    levelDescs: {
      1: "예비초등 · 규칙 두 가지가 한 번 바뀌어요",
      2: "초등 저학년 · 동굴이 세 개, 규칙이 여러 번 바뀌어요",
      3: "초등 고학년 · 규칙이 세 가지, 지도가 사라져요",
    },
    route: "/training/play/cave",
  },
];

export const DOMAIN_NAMES: Record<EFDomain, string> = {
  inhibition: "억제통제",
  workingMemory: "작업기억",
  flexibility: "인지적 유연성",
};

export function getGame(id: GameId): GameInfo {
  return GAMES.find((game) => game.id === id) as GameInfo;
}

// 한 판 결과(맞은 수/전체)로 별 1~3개를 줍니다. 끝까지 해내면 최소 별 1개예요. 평가나 순위가 아닌 격려용입니다.
export function starsFor(correct: number, total: number): 1 | 2 | 3 {
  const ratio = total > 0 ? correct / total : 0;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

const STORAGE_KEY = "ef-site:play-stars";
type StarMap = Partial<Record<GameId, Partial<Record<GameLevel, number>>>>;

function readStars(): StarMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StarMap) : {};
  } catch {
    return {};
  }
}

export function loadStars(gameId: GameId): Partial<Record<GameLevel, number>> {
  return readStars()[gameId] ?? {};
}

// 같은 단계를 다시 하면 더 높은 별만 남깁니다.
export function saveStars(gameId: GameId, level: GameLevel, stars: number): void {
  if (typeof window === "undefined") return;
  try {
    const all = readStars();
    const current = all[gameId]?.[level] ?? 0;
    all[gameId] = { ...all[gameId], [level]: Math.max(current, stars) };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // 저장 공간이 없어도 놀이는 계속할 수 있어야 합니다.
  }
}

export function totalStars(gameId: GameId): number {
  return Object.values(loadStars(gameId)).reduce((sum, n) => sum + (n ?? 0), 0);
}
