"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DOMAIN_NAMES,
  GAME_LEVELS,
  getGame,
  loadStars,
  saveStars,
  starsFor,
  type GameId,
  type GameLevel,
} from "@/lib/trainingGames";
import { CommanderCentered } from "@/components/tasks/story/StoryParts";
import { isFxMuted, setFxMuted, unlockAudio } from "./feedbackFx";
import BrakeGame from "./games/BrakeGame";
import PianoGame from "./games/PianoGame";
import CaveGame from "./games/CaveGame";
import FlagGame from "./games/FlagGame";
import SuitcaseGame from "./games/SuitcaseGame";
import ChefGame from "./games/ChefGame";

export interface GameResult {
  correct: number;
  total: number;
}

export interface GameProps {
  level: GameLevel;
  onFinish: (result: GameResult) => void;
}

const GAME_COMPONENTS: Record<GameId, (props: GameProps) => React.ReactElement> = {
  brake: BrakeGame,
  flag: FlagGame,
  piano: PianoGame,
  suitcase: SuitcaseGame,
  cave: CaveGame,
  chef: ChefGame,
};

type Screen = "intro" | "levels" | "play" | "result";

const primaryButton =
  "w-full rounded-full bg-indigo-500 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-600";

function Stars({ count }: { count: number }) {
  return (
    <span aria-label={`별 ${count}개`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= count ? "" : "opacity-25"}>
          ⭐
        </span>
      ))}
    </span>
  );
}

/**
 * 실행기능 놀이(훈련) 게임의 공통 틀입니다.
 * 이야기 소개 → 단계 선택(1: 예비초등 · 2: 초등 저학년 · 3: 초등 고학년) → 플레이 → 별 결과.
 * ⚠️ 검사와 달리 정답을 바로 알려주고, 이름/점수는 저장하지 않으며 별 개수만 이 기기에 저장합니다.
 * 별은 격려용이며 평가·순위가 아닙니다.
 */
export default function GameShell({ gameId }: { gameId: GameId }) {
  const game = getGame(gameId);
  const Game = GAME_COMPONENTS[gameId];

  const [screen, setScreen] = useState<Screen>("intro");
  const [level, setLevel] = useState<GameLevel>(1);
  const [runKey, setRunKey] = useState(0);
  const [result, setResult] = useState<{ stars: 1 | 2 | 3; correct: number; total: number } | null>(null);
  const [saved, setSaved] = useState<Partial<Record<GameLevel, number>>>({});
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isFxMuted());
  }, []);

  useEffect(() => {
    setSaved(loadStars(gameId));
  }, [gameId, screen]);

  const start = (next: GameLevel) => {
    unlockAudio(); // 버튼을 누르는 순간 소리 장치를 깨워서 모바일에서도 소리가 나게 합니다
    setLevel(next);
    setRunKey((k) => k + 1);
    setScreen("play");
  };

  const finish = (r: GameResult) => {
    const stars = starsFor(r.correct, r.total);
    saveStars(gameId, level, stars);
    setResult({ stars, ...r });
    setScreen("result");
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#1a1f3c] to-[#050a18] p-5 text-white sm:p-7">
      <div className="mb-4 flex items-center justify-between text-xs text-slate-300">
        <Link href="/training" className="hover:underline">
          놀이 목록
        </Link>
        <span className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFxMuted(!muted);
              setMuted(!muted);
            }}
            aria-label={muted ? "소리 켜기" : "소리 끄기"}
            className="rounded-full bg-white/10 px-2 py-1 text-sm"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          {DOMAIN_NAMES[game.domain]}
        </span>
      </div>

      {screen === "intro" && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-5xl" aria-hidden="true">
              {game.icon}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-[#00ff88]">{game.title}</h1>
            <p className="mt-1 text-sm text-slate-300">{game.tagline}</p>
          </div>
          {/* 이야기 카드: 장면 + 본부 대장을 한 상자로 묶어요 */}
          <div className="space-y-4 rounded-2xl bg-white/5 px-5 py-6 text-center ring-1 ring-white/15">
            <p className="text-4xl" aria-hidden="true">
              {game.sceneEmoji}
            </p>
            <p className="text-sm italic leading-relaxed text-slate-200">{game.sceneText}</p>
            <div className="mx-auto h-px w-16 bg-white/20" />
            <CommanderCentered>{game.commanderLine}</CommanderCentered>
          </div>

          {/* 활동 방법: 흰 바탕에 검은 글씨로 눈에 띄게 */}
          <div className="rounded-2xl bg-white px-5 py-5 text-left text-slate-900">
            <p className="text-sm font-extrabold text-indigo-600">🎯 이렇게 놀아요</p>
            <ul className="mt-2 space-y-2 text-base font-semibold leading-relaxed">
              {game.howTo.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={() => setScreen("levels")} className={primaryButton}>
            단계 고르기
          </button>
        </div>
      )}

      {screen === "levels" && (
        <div className="space-y-4">
          <h2 className="text-center text-xl font-extrabold text-[#00ff88]">단계를 골라요</h2>
          <p className="text-center text-xs text-slate-300">
            어느 단계든 괜찮아요. 쉬우면 다음 단계로, 어려우면 앞 단계로 가도 돼요.
          </p>
          {GAME_LEVELS.map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => start(lv)}
              className="flex w-full items-center justify-between rounded-2xl bg-white/10 p-4 text-left ring-1 ring-white/20 hover:bg-white/20"
            >
              <span>
                <span className="block text-lg font-bold">{game.levelNames[lv]}</span>
                <span className="mt-1 block text-xs text-slate-300">{game.levelDescs[lv]}</span>
              </span>
              <span className="shrink-0 text-xl">
                <Stars count={saved[lv] ?? 0} />
              </span>
            </button>
          ))}
        </div>
      )}

      {screen === "play" && (
        <div>
          <p className="mb-3 text-center text-sm font-bold text-[#a2ffcf]">{game.levelNames[level]}</p>
          <Game key={runKey} level={level} onFinish={finish} />
          <button
            type="button"
            onClick={() => setScreen("levels")}
            className="mx-auto mt-6 block text-xs text-slate-400 underline"
          >
            그만하고 단계 고르기
          </button>
        </div>
      )}

      {screen === "result" && result && (
        <div className="space-y-5 text-center">
          <p className="text-5xl" aria-hidden="true">
            🎉
          </p>
          <h2 className="text-2xl font-extrabold text-[#00ff88]">끝까지 해냈어요!</h2>
          <p className="text-4xl">
            <Stars count={result.stars} />
          </p>
          <p className="rounded-2xl bg-white px-4 py-3 text-base font-extrabold text-slate-900">
            {result.total}번 중 {result.correct}번 잘 해냈어요.
          </p>
          <div className="rounded-2xl bg-white/5 px-5 py-5 ring-1 ring-white/15">
            <CommanderCentered>
            {result.stars === 3
              ? level < 3
                ? "대단해요! 다음 단계에 도전해 볼까요?"
                : "대단해요! 마지막 단계까지 멋지게 해냈어요! 다른 게임도 놀러 가 볼까요?"
              : result.stars === 2
                ? "좋아요! 한 번 더 하면 더 멋져질 거예요."
                : "끝까지 해낸 게 멋져요! 다시 하면 점점 쉬워져요."}
            </CommanderCentered>
          </div>
          <div className="space-y-3">
            <button type="button" onClick={() => start(level)} className={primaryButton}>
              한 번 더 하기
            </button>
            {level < 3 && (
              <button
                type="button"
                onClick={() => start((level + 1) as GameLevel)}
                className="w-full rounded-full border border-[#00ff88] px-6 py-4 text-lg font-bold text-[#00ff88] hover:bg-white/5"
              >
                다음 단계로
              </button>
            )}
            {level === 3 && (
              <Link
                href="/training"
                className="block w-full rounded-full border border-[#00ff88] px-6 py-4 text-center text-lg font-bold text-[#00ff88] hover:bg-white/5"
              >
                다른 게임 하러 가기
              </Link>
            )}
            <button
              type="button"
              onClick={() => setScreen("levels")}
              className="w-full rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              단계 고르기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
