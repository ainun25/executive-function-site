// 실행기능 놀이(훈련) 게임 목록과 진도(별) 저장입니다.
// 놀이는 "검사"가 아니므로 정답을 바로 알려주고, 결과는 이 기기에 별 개수만 저장합니다(이름/점수는 서버로 보내지 않음).

import type { EFDomain } from "@/types";

export type GameId = "brake" | "flag" | "piano" | "suitcase" | "cave" | "chef";
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
    id: "flag",
    domain: "inhibition",
    title: "청기백기 깃발 대장",
    icon: "🚩",
    tagline: "대장의 말만 따라 깃발을 올리고 내려요. 도깨비 말은 따라 하면 안 돼요!",
    sceneEmoji: "🏴‍☠️",
    sceneText: "깃발 마을 운동회 날! 깃발 대장이 청기와 백기로 신호를 보내요. 그런데 장난꾸러기 도깨비가 대장 흉내를 내고 있어요!",
    commanderLine: "깃발 요원님, 누가 말하는지 잘 보고 움직여요!",
    howTo: [
      "🧑‍✈️ 깃발은 늘 가운데에서 시작해요. 깃발 대장이 말하면 그대로 깃발 버튼을 눌러요.",
      "👹 도깨비가 말하면 아무것도 누르지 말고 꾹 참아요!",
      "🔄 3단계의 반대 대장은 말한 것과 반대로 눌러요. (올려 → 내려)",
    ],
    levelNames: { 1: "1단계 · 연습 운동장", 2: "2단계 · 운동회 본경기", 3: "3단계 · 반대 대장 등장" },
    levelDescs: {
      1: "예비초등 · 올리기만, 도깨비는 가끔",
      2: "초등 저학년 · 올리기와 내리기가 나와요",
      3: "초등 고학년 · 반대로 해야 할 때도 있어요",
    },
    route: "/training/play/flag",
  },
  {
    id: "piano",
    domain: "workingMemory",
    title: "마법 피아노",
    icon: "🎹",
    tagline: "건반을 치면 도레미파솔 소리가 나요! 위치와 글자를 기억해서 연주해요.",
    sceneEmoji: "🌙",
    sceneText: "깊은 밤, 숲속 마법 피아노가 혼자 반짝이기 시작했어요. 순서대로 연주하면 숲의 비밀 문이 열린대요!",
    commanderLine: "마법사님, 피아노가 알려주는 음을 기억해서 멋지게 연주해 주세요!",
    howTo: [
      "🎹 건반을 칠 때마다 그 음(도레미파솔)이 소리 나고 건반이 반짝여요.",
      "1단계 📍 반짝이는 위치를 기억해서 쳐요.",
      "2단계 🔤 글자를 보고 치기 → 🧠 글자가 사라지면 기억해서 쳐요.",
      "3단계 ⬅️ 위치와 글자를 기억해서 거꾸로(마지막부터) 쳐요.",
    ],
    levelNames: { 1: "1단계 · 위치 기억", 2: "2단계 · 글자 기억", 3: "3단계 · 거꾸로 (위치, 글자)" },
    levelDescs: {
      1: "예비초등 · 반짝이는 위치를 기억해서 쳐요",
      2: "초등 저학년 · 글자를 보고 치다가, 글자가 사라지면 기억해서 쳐요",
      3: "초등 고학년 · 위치와 글자를 기억해서 거꾸로 쳐요",
    },
    route: "/training/play/piano",
  },
  {
    id: "suitcase",
    domain: "workingMemory",
    title: "여행 가방 챙기기",
    icon: "🧳",
    tagline: "한꺼번에 보여준 물건을 기억해서 가방에 챙겨요!",
    sceneEmoji: "🛫",
    sceneText: "내일은 신나는 여행 출발일! 탁자 위에 여행 물건들이 잠깐 나타났다 사라져요. 잊지 말고 챙겨야 해요!",
    commanderLine: "여행 가이드예요! 어떤 물건이 있었는지 잘 기억해 주세요.",
    howTo: [
      "👀 물건들이 한꺼번에 잠깐 나타나요. 모두 잘 봐요.",
      "🧺 물건이 사라지면, 보였던 물건을 모두 골라 가방에 담아요.",
      "➕ 단계가 오르면 물건이 더 많아져요!",
    ],
    levelNames: { 1: "1단계 · 간식 가방", 2: "2단계 · 하루 여행 가방", 3: "3단계 · 긴 여행 가방" },
    levelDescs: {
      1: "예비초등 · 물건 2~3개",
      2: "초등 저학년 · 물건 3~5개",
      3: "초등 고학년 · 물건 4~6개, 보는 시간이 짧아요",
    },
    route: "/training/play/suitcase",
  },
  {
    id: "cave",
    domain: "flexibility",
    title: "조건에 맞는 동굴 항해",
    icon: "⛵",
    tagline: "지도 그림과 색·모양·개수가 같은 동굴로 배를 몰아요!",
    sceneEmoji: "🌊",
    sceneText: "작은 배를 타고 보물 섬으로 가는 길, 동굴이 여러 개 나타났어요. 하지만 지도 보는 기준이 가끔 바뀐대요!",
    commanderLine: "선장님, 지도 그림과 같은 동굴로 들어가야 해요!",
    howTo: [
      "🗺️ 위에 큰 지도 그림이 나와요. 지금 같아야 하는 것은 색, 모양, 개수 중 하나예요.",
      "⛵ 그것이 같은 동굴을 눌러요.",
      "🌪️ 폭풍이 오면 바뀌어요! 3단계는 지도에 🖼️ 금빛 액자가 있으면 모양, 없으면 색이에요.",
    ],
    levelNames: { 1: "1단계 · 잔잔한 바다", 2: "2단계 · 안개 바다", 3: "3단계 · 폭풍 바다" },
    levelDescs: {
      1: "예비초등 · 색과 모양, 한 번 바뀌어요",
      2: "초등 저학년 · 동굴이 세 개, 색·모양·개수가 바뀌어요",
      3: "초등 고학년 · 지도에 액자가 있으면 모양, 없으면 색을 기억해서 골라요",
    },
    route: "/training/play/cave",
  },
  {
    id: "chef",
    domain: "flexibility",
    title: "변덕쟁이 요리사",
    icon: "🧑‍🍳",
    tagline: "손님 주문에 맞게 재료를 색이나 종류로 나눠요. 주문이 자꾸 바뀌어요!",
    sceneEmoji: "🍳",
    sceneText: "별빛 식당에 손님이 가득해요! 손님은 재료를 두 바구니에 나눠 달라고 하는데, 마음이 자주 바뀐대요.",
    commanderLine: "주방장이에요! 손님의 주문이 바뀌면 바로 알려 줄게요.",
    howTo: [
      "🥕 재료가 하나씩 나와요. 버튼에 적힌 대로 왼쪽/오른쪽 바구니에 넣어요.",
      "🔔 1단계는 손님이 주문(색 또는 종류)을 바꾸면 알림이 나와요.",
      "🖼️ 2단계부터는 재료에 금빛 액자가 있으면 종류(채소·과일), 없으면 색(초록·빨강)으로 나눠요. 3단계는 버튼 글자가 사라져요!",
    ],
    levelNames: { 1: "1단계 · 한가한 점심", 2: "2단계 · 북적이는 저녁", 3: "3단계 · 바쁜 파티" },
    levelDescs: {
      1: "예비초등 · 주문이 한 번 바뀌어요",
      2: "초등 저학년 · 액자가 있으면 종류, 없으면 색 (버튼 글자가 도와줘요)",
      3: "초등 고학년 · 액자를 보고 기억해서 나눠요 (버튼 글자가 없어요)",
    },
    route: "/training/play/chef",
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
