"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameShell";

/**
 * 마법 피아노 (작업기억 놀이).
 * 건반이 순서대로 반짝이고 소리가 나면, 같은 순서로(3단계는 거꾸로) 눌러 연주합니다.
 * 틀리면 같은 순서를 한 번 더 들려주고 다시 도전할 수 있어요(두 번째 시도는 점수에 넣지 않고 격려만 해요).
 * ⚠️ 놀이이므로 정답을 바로 알려줍니다. 결과는 별 개수 외에 저장하지 않습니다.
 */

const KEYS = [
  { label: "도", color: "#f43f5e", freq: 262 },
  { label: "레", color: "#f59e0b", freq: 294 },
  { label: "미", color: "#10b981", freq: 330 },
  { label: "파", color: "#0ea5e9", freq: 349 },
  { label: "솔", color: "#8b5cf6", freq: 392 },
];

// 단계별 설정: 건반 수, 순서 길이(시작~끝, 길이마다 2판), 거꾸로 여부, 건반이 켜지는 시간(ms)
const CONFIG = {
  1: { keys: 4, from: 2, to: 4, backward: false, showMs: 750, gapMs: 300 },
  2: { keys: 5, from: 3, to: 5, backward: false, showMs: 600, gapMs: 250 },
  3: { keys: 5, from: 2, to: 4, backward: true, showMs: 650, gapMs: 250 },
} as const;

type Phase = "listen" | "play" | "feedback";

function makeRounds(level: 1 | 2 | 3): number[][] {
  const cfg = CONFIG[level];
  const rounds: number[][] = [];
  for (let len = cfg.from; len <= cfg.to; len++) {
    for (let k = 0; k < 2; k++) {
      // 같은 건반이 연속으로 나오지 않게 순서를 만듭니다.
      const seq: number[] = [];
      while (seq.length < len) {
        const next = Math.floor(Math.random() * cfg.keys);
        if (seq[seq.length - 1] !== next) seq.push(next);
      }
      rounds.push(seq);
    }
  }
  return rounds;
}

function playTone(ctx: AudioContext | null, freq: number) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // 소리가 나지 않아도 놀이는 계속할 수 있어요.
  }
}

export default function PianoGame({ level, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const [rounds] = useState<number[][]>(() => makeRounds(level));
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("listen");
  const [lit, setLit] = useState<number | null>(null);
  const [input, setInput] = useState<number[]>([]);
  const [message, setMessage] = useState("👀 잘 보고 기억해요!");
  const [lastOk, setLastOk] = useState<boolean | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const attemptRef = useRef(0); // 이번 판의 시도 횟수 (0: 첫 시도)
  const correctFirstTryRef = useRef(0);
  const roundRef = useRef(0);
  const finishedRef = useRef(false);

  const schedule = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = Ctor ? new Ctor() : null;
    } catch {
      ctxRef.current = null;
    }
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      ctxRef.current?.close().catch(() => undefined);
    };
  }, []);

  // 순서를 보여주고 소리를 들려줍니다.
  const listen = (roundIdx: number) => {
    const seq = rounds[roundIdx];
    setPhase("listen");
    setInput([]);
    setLastOk(null);
    setMessage("👀 잘 보고 기억해요!");
    let t = 700;
    seq.forEach((key) => {
      schedule(() => {
        setLit(key);
        playTone(ctxRef.current, KEYS[key].freq);
      }, t);
      schedule(() => setLit(null), t + cfg.showMs);
      t += cfg.showMs + cfg.gapMs;
    });
    schedule(() => {
      setPhase("play");
      setMessage(cfg.backward ? "⬅️ 거꾸로! 마지막 건반부터 눌러요" : "👆 같은 순서로 눌러요");
    }, t);
  };

  useEffect(() => {
    listen(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextRound = () => {
    const next = roundRef.current + 1;
    if (next >= rounds.length) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish({ correct: correctFirstTryRef.current, total: rounds.length });
      }
      return;
    }
    roundRef.current = next;
    attemptRef.current = 0;
    setRoundIndex(next);
    listen(next);
  };

  const pressKey = (key: number) => {
    if (phase !== "play") return;
    playTone(ctxRef.current, KEYS[key].freq);
    const seq = rounds[roundIndex];
    const expected = cfg.backward ? [...seq].reverse() : seq;
    const next = [...input, key];

    if (key !== expected[input.length]) {
      // 틀렸을 때: 순서를 한 번 더 들려주고 다시 도전해요.
      setLastOk(false);
      setPhase("feedback");
      if (attemptRef.current === 0) {
        attemptRef.current = 1;
        setMessage("앗, 다른 건반이에요. 다시 한 번 들어볼까요? 🎧");
        schedule(() => listen(roundIndex), 1500);
      } else {
        setMessage("괜찮아요! 다음 곡으로 가요 🎵");
        schedule(nextRound, 1500);
      }
      return;
    }

    setInput(next);
    if (next.length === expected.length) {
      if (attemptRef.current === 0) correctFirstTryRef.current += 1;
      setLastOk(true);
      setPhase("feedback");
      setMessage("딩동댕! 잘 쳤어요 🎉");
      schedule(nextRound, 1300);
    }
  };

  const seqLen = rounds[roundIndex].length;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-xs text-slate-400">
        {roundIndex + 1} / {rounds.length} · 순서 길이 {seqLen}개
      </p>
      <p
        className={`min-h-[2.5rem] text-base font-bold ${
          lastOk === null ? "text-slate-200" : lastOk ? "text-[#00ff88]" : "text-amber-300"
        }`}
        aria-live="polite"
      >
        {message}
      </p>

      <div className="flex w-full justify-center gap-2">
        {KEYS.slice(0, cfg.keys).map((key, i) => {
          const isLit = lit === i;
          return (
            <button
              key={key.label}
              type="button"
              disabled={phase !== "play"}
              onClick={() => pressKey(i)}
              className="flex h-40 flex-1 flex-col items-center justify-end rounded-2xl pb-4 text-xl font-extrabold text-white transition-all"
              style={{
                backgroundColor: isLit ? key.color : `${key.color}55`,
                boxShadow: isLit ? `0 0 28px ${key.color}` : "none",
                transform: isLit ? "translateY(-6px)" : "none",
              }}
            >
              {key.label}
            </button>
          );
        })}
      </div>

      {/* 누른 개수 표시 */}
      <p className="text-lg tracking-widest text-slate-300" aria-label={`누른 개수 ${input.length} / ${seqLen}`}>
        {Array.from({ length: seqLen }, (_, i) => (i < input.length ? "●" : "○")).join(" ")}
      </p>
      {cfg.backward && <p className="text-xs text-amber-300">⬅️ 3단계는 거꾸로 눌러요!</p>}
    </div>
  );
}
