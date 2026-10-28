"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTrialTimer } from "@/lib/reactionTimer";
import EarthGuardStimulus, { type EarthGuardLevel } from "./EarthGuardStimulus";

/**
 * 지구 수호대 작전 - 억제통제(Go/No-Go) 놀이.
 * 아군은 빠르게 터치하고, 적군은 참는 3단계 게임입니다.
 *
 * ⚠️ 이 놀이는 "검사"가 아닙니다. 정답을 바로 알려주고 문항 수/속도도 검사와 다르며,
 * 결과는 어디에도 저장되지 않고 화면에만 보여줍니다(이름/나이도 묻지 않습니다).
 * 점수로 아이를 평가하거나 등급을 매기지 않고, 끝까지 해낸 것을 칭찬하는 데 초점을 둡니다.
 */

type Screen = "intro" | "guide" | "game" | "levelResult" | "final";
type Phase = "wait" | "stimulus" | "feedback";

const PRACTICE_TRIALS = 4;
const MAIN_TRIALS = 15;
const ALLY_RATIO = 0.7;
const PRE_STIMULUS_MS = 1100; // 자극이 나타나기 전 대기
const RESPONSE_WINDOW_MS = 1500; // 반응할 수 있는 시간
const FEEDBACK_MS = 900; // 반응 직후 피드백을 보여주는 시간

interface LevelInfo {
  title: string;
  story: string;
  visual: EarthGuardLevel;
  cue: string;
}

const LEVELS: LevelInfo[] = [
  { title: "연습 단계", story: "작전 준비를 해볼까요?", visual: 1, cue: "아군 행성은 고리가 있고, 적군 행성은 뾰족한 가시가 있어요." },
  { title: "1단계: 행성 수호", story: "우리 행성이 다가오고 있어요!", visual: 1, cue: "아군 행성은 고리가 있고, 적군 행성은 뾰족한 가시가 있어요." },
  { title: "2단계: UFO 확인", story: "엔진 불꽃을 확인해요!", visual: 2, cue: "아군 UFO는 동그란 불꽃, 적군 UFO는 뾰족한 불꽃이에요." },
  { title: "3단계: 요원 선별", story: "변장한 적군 요원을 찾아요!", visual: 3, cue: "적군 요원은 검은 고글을 쓰고 있어요." },
];

interface TrialStat {
  isAlly: boolean;
  ok: boolean; // 아군이면 터치, 적군이면 참았을 때 true
  reactionTime: number; // 터치한 경우에만 (ms)
}

interface LevelResult {
  allyHits: number;
  allyTotal: number;
  enemyHolds: number;
  enemyTotal: number;
  meanReactionTime: number | null;
}

function makeSequence(level: number): boolean[] {
  const total = level === 0 ? PRACTICE_TRIALS : MAIN_TRIALS;
  const allyCount = level === 0 ? 2 : Math.round(total * ALLY_RATIO);
  const sequence = Array.from({ length: total }, (_, index) => index < allyCount);
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }
  return sequence;
}

function summarize(stats: TrialStat[]): LevelResult {
  const ally = stats.filter((stat) => stat.isAlly);
  const enemy = stats.filter((stat) => !stat.isAlly);
  const allyHitStats = ally.filter((stat) => stat.ok);
  return {
    allyHits: allyHitStats.length,
    allyTotal: ally.length,
    enemyHolds: enemy.filter((stat) => stat.ok).length,
    enemyTotal: enemy.length,
    meanReactionTime: allyHitStats.length
      ? Math.round(allyHitStats.reduce((sum, stat) => sum + stat.reactionTime, 0) / allyHitStats.length)
      : null,
  };
}

export default function EarthGuardGame() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [level, setLevel] = useState(0);
  const [trial, setTrial] = useState(1);
  const [phase, setPhase] = useState<Phase>("wait");
  const [isAlly, setIsAlly] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null);
  const [lastResult, setLastResult] = useState<LevelResult | null>(null);
  const [finalResults, setFinalResults] = useState<LevelResult[]>([]);

  const timer = useTrialTimer();
  const levelRef = useRef(0);
  const phaseRef = useRef<Phase>("wait");
  const isAllyRef = useRef(true);
  const sequenceRef = useRef<boolean[]>([]);
  const statsRef = useRef<TrialStat[]>([]);
  const resultsRef = useRef<LevelResult[]>([]);
  const timeoutIdsRef = useRef<number[]>([]);

  const schedule = useCallback((callback: () => void, delay: number) => {
    timeoutIdsRef.current.push(window.setTimeout(callback, delay));
  }, []);

  const clearScheduled = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  useEffect(() => clearScheduled, [clearScheduled]);

  const changePhase = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const finishLevel = () => {
    const currentLevel = levelRef.current;
    if (currentLevel === 0) {
      // 연습은 결과를 보여주지 않고 바로 1단계 안내로 넘어갑니다.
      levelRef.current = 1;
      setLevel(1);
      setScreen("guide");
      return;
    }
    const result = summarize(statsRef.current);
    resultsRef.current = [...resultsRef.current, result];
    setLastResult(result);
    setScreen("levelResult");
  };

  const goNext = (finishedTrial: number) => {
    const total = levelRef.current === 0 ? PRACTICE_TRIALS : MAIN_TRIALS;
    if (finishedTrial >= total) finishLevel();
    else runTrial(finishedTrial + 1);
  };

  const record = (ok: boolean, reactionTime: number) => {
    if (levelRef.current === 0) return; // 연습은 기록하지 않습니다
    statsRef.current.push({ isAlly: isAllyRef.current, ok, reactionTime });
  };

  const runTrial = (trialNumber: number) => {
    setTrial(trialNumber);
    setFeedback(null);
    timer.reset();
    changePhase("wait");

    schedule(() => {
      const ally = sequenceRef.current[trialNumber - 1];
      isAllyRef.current = ally;
      setIsAlly(ally);
      changePhase("stimulus");
      timer.armStimulus();

      schedule(() => {
        if (phaseRef.current !== "stimulus") return;
        // 시간 안에 반응이 없었음: 아군이면 놓친 것, 적군이면 잘 참은 것
        record(!ally, 0);
        goNext(trialNumber);
      }, RESPONSE_WINDOW_MS);
    }, PRE_STIMULUS_MS);
  };

  const handleResponse = () => {
    // 자극이 나타나기 전/후의 입력과, 한 문항에서의 두 번째 이상 입력은 무시합니다.
    if (phaseRef.current !== "stimulus") return;
    const reactionTime = timer.recordResponse();
    if (reactionTime === null) return;

    clearScheduled();
    changePhase("feedback");
    const ally = isAllyRef.current;
    record(ally, Math.round(reactionTime));
    setFeedback(ally ? { text: "반가워요!", good: true } : { text: "앗!", good: false });

    const currentTrial = trial;
    schedule(() => goNext(currentTrial), FEEDBACK_MS);
  };

  // PC에서는 스페이스바/엔터로도 반응할 수 있습니다. (키를 누르고 있을 때의 반복 입력은 무시)
  const handleResponseRef = useRef(handleResponse);
  handleResponseRef.current = handleResponse;
  useEffect(() => {
    if (screen !== "game") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        handleResponseRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen]);

  const openGuide = (nextLevel: number) => {
    clearScheduled();
    levelRef.current = nextLevel;
    setLevel(nextLevel);
    setScreen("guide");
  };

  const startLevel = () => {
    sequenceRef.current = makeSequence(levelRef.current);
    statsRef.current = [];
    setScreen("game");
    runTrial(1);
  };

  const restart = () => {
    clearScheduled();
    resultsRef.current = [];
    setFinalResults([]);
    setLastResult(null);
    levelRef.current = 0;
    setLevel(0);
    setScreen("intro");
  };

  const showFinal = () => {
    setFinalResults(resultsRef.current);
    setScreen("final");
  };

  const info = LEVELS[level];
  const total = level === 0 ? PRACTICE_TRIALS : MAIN_TRIALS;
  const buttonClass =
    "w-full max-w-xs rounded-full bg-indigo-500 px-6 py-4 text-lg font-bold text-white shadow-[0_5px_0_#312e81] transition active:translate-y-[3px] active:shadow-[0_2px_0_#312e81]";

  return (
    <div
      className="relative mx-auto flex min-h-[620px] w-full max-w-md select-none flex-col overflow-hidden rounded-3xl border-2 border-slate-600 bg-gradient-to-b from-[#1a1f3c] to-[#050a18] text-white"
      style={{ touchAction: "manipulation" }}
      onPointerDown={screen === "game" ? handleResponse : undefined}
    >
      {screen === "intro" && (
        <Screen>
          <h2 className="text-3xl font-extrabold text-[#00ff88]">지구 수호대 작전</h2>
          <p className="mt-4 leading-relaxed text-slate-200">
            멋진 요원이 되려면 3가지 미션을 해내야 해요!
            <br />
            <strong className="text-white">아군은 터치! 적군은 참기!</strong>
            <br />
            최대한 빠르게 인사해주세요.
          </p>
          <div className="mt-8 flex w-full flex-col items-center gap-3">
            <button type="button" className={buttonClass} onClick={() => openGuide(0)}>
              연습 시작
            </button>
            <Link href="/training" className="text-sm text-slate-400 underline">
              놀이 목록으로
            </Link>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            놀이 기록은 저장되지 않아요. 이 놀이는 검사가 아니라 재미있게 즐기는 활동이에요.
          </p>
        </Screen>
      )}

      {screen === "guide" && (
        <Screen>
          <h2 className="text-2xl font-extrabold text-[#ffcc00]">{info.title}</h2>
          <p className="mt-1 text-[#a2ffcf]">{info.story}</p>
          <div className="my-4 flex w-full justify-evenly">
            <GuideExample level={info.visual} isAlly />
            <GuideExample level={info.visual} isAlly={false} />
          </div>
          <p className="rounded-xl border border-[#00ff88]/50 bg-white/10 px-4 py-3 text-sm leading-relaxed">
            {info.cue}
            <br />
            <strong>아군이 나오면 빠르게 터치! 적군이 나오면 꾹 참기!</strong>
          </p>
          <div className="mt-6 flex w-full justify-center">
            <button type="button" className={buttonClass} onClick={startLevel}>
              미션 시작!
            </button>
          </div>
        </Screen>
      )}

      {screen === "game" && (
        <Screen>
          <p className="text-lg text-slate-400" aria-live="polite">
            {level === 0 ? "연습" : `${level}단계`}: {trial}/{total}
          </p>
          <div className="my-6 flex h-52 w-full items-center justify-center">
            {phase !== "wait" && <EarthGuardStimulus level={info.visual} isAlly={isAlly} />}
          </div>
          <p
            className={`h-10 text-3xl font-extrabold ${feedback?.good ? "text-[#00ff88]" : "text-[#ff6b6b]"}`}
            aria-live="polite"
          >
            {feedback?.text}
          </p>
          <p className="mt-6 text-xs text-slate-500">화면 아무 곳이나 터치 (PC는 스페이스바)</p>
        </Screen>
      )}

      {screen === "levelResult" && lastResult && (
        <Screen>
          <h2 className="text-2xl font-extrabold text-[#ffcc00]">⭐ {level}단계 완료!</h2>
          <ResultStats result={lastResult} />
          <div className="mt-6 flex w-full justify-center">
            <button
              type="button"
              className={buttonClass}
              onClick={() => (level === 3 ? showFinal() : openGuide(level + 1))}
            >
              {level === 3 ? "최종 결과 보기" : "다음 단계로"}
            </button>
          </div>
        </Screen>
      )}

      {screen === "final" && (
        <Screen>
          <h2 className="text-2xl font-extrabold text-[#00ff88]">🏆 미션 완료 보고서</h2>
          <p className="mt-2 text-slate-200">3단계를 끝까지 해낸 멋진 요원이에요! ⭐⭐⭐</p>
          <div className="mt-4 w-full space-y-3 text-left">
            {finalResults.map((result, index) => (
              <div key={LEVELS[index + 1].title} className="rounded-2xl bg-white/10 p-4">
                <p className="font-bold text-[#ffcc00]">{LEVELS[index + 1].title}</p>
                <ResultStats result={result} compact />
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-300">
            적군이 헷갈릴 때는 한 박자 쉬고 보면 더 쉬워요. 또 도전해볼까요?
          </p>
          <div className="mt-4 flex w-full flex-col items-center gap-2">
            <button type="button" className={buttonClass} onClick={restart}>
              다시 도전
            </button>
            <Link href="/training" className="text-sm text-slate-400 underline">
              놀이 목록으로
            </Link>
          </div>
        </Screen>
      )}
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">{children}</div>
  );
}

function GuideExample({ level, isAlly }: { level: EarthGuardLevel; isAlly: boolean }) {
  return (
    <div className="text-center">
      <EarthGuardStimulus level={level} isAlly={isAlly} size={132} />
      <p className={`mt-1 text-lg font-bold ${isAlly ? "text-[#00ff88]" : "text-[#ff6b6b]"}`}>
        {isAlly ? "아군" : "적군"}
        <br />
        <span className="text-base">{isAlly ? "(터치)" : "(참기)"}</span>
      </p>
    </div>
  );
}

function ResultStats({ result, compact = false }: { result: LevelResult; compact?: boolean }) {
  return (
    <ul className={`${compact ? "mt-1 space-y-1 text-sm" : "mt-6 space-y-2 text-lg"} text-slate-100`}>
      <li>
        🤝 아군에게 인사했어요: <strong>{result.allyHits}</strong> / {result.allyTotal}
      </li>
      <li>
        ✋ 적군을 잘 참았어요: <strong>{result.enemyHolds}</strong> / {result.enemyTotal}
      </li>
      <li>
        ⚡ 인사한 평균 속도: <strong>{result.meanReactionTime !== null ? `${result.meanReactionTime}ms` : "-"}</strong>
      </li>
    </ul>
  );
}
