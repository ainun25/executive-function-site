"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameShell";
import { FxHint, FxOverlay, playNote, shakeClass, useFx } from "../feedbackFx";

/**
 * 마법 피아노 (작업기억 - 순서 기억 놀이).
 * 건반을 칠 때마다 건반이 반짝이고 그 음("도레미파솔")이 소리 납니다. 네 가지 방식이 있어요.
 *  1) 위치 기억(position): 반짝이는 위치(글자 없음)를 기억해서 똑같이 칩니다 (공간 위치 기억).
 *  2) 글자 보고 치기(text): "솔 → 미 → 도"를 글자로 보고, 글자에 맞는 건반을 찾아 칩니다.
 *  3) 글자 기억(recall): "솔 → 미 → 도"를 글자로 한꺼번에 보여준 뒤 글자를 없애고, 기억해서 같은 순서로 칩니다.
 *  4) 거꾸로 따라 치기(backward): 불빛과 소리를 보고 마지막 소리부터 거꾸로 칩니다 (기억 + 조작).
 * 틀리면 같은 순서를 한 번 더 보여주고 다시 도전할 수 있어요(두 번째 시도는 점수에 넣지 않고 격려만 해요).
 * ⚠️ 놀이이므로 정답을 바로 알려줍니다. 결과는 별 개수 외에 저장하지 않습니다.
 */

type Mode = "text" | "position" | "recall" | "backward";

const KEYS = [
  { label: "도", color: "#f43f5e", freq: 262 },
  { label: "레", color: "#f59e0b", freq: 294 },
  { label: "미", color: "#10b981", freq: 330 },
  { label: "파", color: "#0ea5e9", freq: 349 },
  { label: "솔", color: "#8b5cf6", freq: 392 },
];

const MODE_INFO: Record<Mode, { icon: string; title: string; howto: string; playMsg: string }> = {
  text: {
    icon: "🔤",
    title: "글자 보고 치기",
    howto: "글자로 나온 음을 보고, 같은 글자의 건반을 찾아 쳐요. 칠 때마다 소리가 나요!",
    playMsg: "🔤 글자 순서대로 건반을 쳐요",
  },
  position: {
    icon: "📍",
    title: "위치 기억",
    howto: "반짝이는 건반의 위치를 기억해서 똑같은 순서로 쳐요. 건반에 글자가 없어요!",
    playMsg: "📍 반짝인 위치 순서대로 쳐요",
  },
  recall: {
    icon: "🧠",
    title: "글자 기억",
    howto: "글자가 한꺼번에 잠깐 나왔다가 사라져요. 순서를 기억해서 같은 순서로 건반을 쳐요!",
    playMsg: "🧠 글자가 사라졌어요! 기억한 순서대로 쳐요",
  },
  backward: {
    icon: "⬅️",
    title: "거꾸로 따라 치기",
    howto: "반짝이고 소리 나는 순서를 기억해서, 마지막 소리부터 거꾸로 쳐요!",
    playMsg: "⬅️ 거꾸로! 마지막 소리부터 쳐요",
  },
};

// 단계별 판 구성: 방식과 순서 길이
const PLAN: Record<1 | 2 | 3, { mode: Mode; len: number }[]> = {
  1: [
    { mode: "text", len: 2 },
    { mode: "text", len: 3 },
    { mode: "position", len: 2 },
    { mode: "position", len: 2 },
    { mode: "position", len: 3 },
    { mode: "position", len: 3 },
  ],
  2: [
    { mode: "position", len: 3 },
    { mode: "position", len: 4 },
    { mode: "recall", len: 2 },
    { mode: "recall", len: 3 },
    { mode: "recall", len: 3 },
    { mode: "recall", len: 4 },
  ],
  3: [
    { mode: "recall", len: 3 },
    { mode: "recall", len: 4 },
    { mode: "backward", len: 2 },
    { mode: "backward", len: 3 },
    { mode: "backward", len: 3 },
    { mode: "backward", len: 4 },
  ],
};

// 글자 기억에서 글자를 보여주는 시간(ms): 글자가 많을수록 길게
function recallShowMs(len: number): number {
  return 1600 + 700 * len;
}

// 건반이 켜지는 시간과 사이 간격(ms)
const TIMING = {
  1: { showMs: 750, gapMs: 300 },
  2: { showMs: 600, gapMs: 250 },
  3: { showMs: 600, gapMs: 250 },
} as const;

interface Round {
  mode: Mode;
  seq: number[];
}

function makeSeq(len: number): number[] {
  // 같은 건반이 연속으로 나오지 않게 순서를 만듭니다.
  const seq: number[] = [];
  while (seq.length < len) {
    const next = Math.floor(Math.random() * KEYS.length);
    if (seq[seq.length - 1] !== next) seq.push(next);
  }
  return seq;
}

type Phase = "intro" | "listen" | "play" | "feedback";

export default function PianoGame({ level, onFinish }: GameProps) {
  const timing = TIMING[level];
  const fx = useFx();
  const [rounds] = useState<Round[]>(() => PLAN[level].map((r) => ({ mode: r.mode, seq: makeSeq(r.len) })));
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [lit, setLit] = useState<number | null>(null);
  const [pressed, setPressed] = useState<number | null>(null);
  const [input, setInput] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [lastOk, setLastOk] = useState<boolean | null>(null);
  const [replayUsed, setReplayUsed] = useState(false);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const attemptRef = useRef(0); // 이번 판의 시도 횟수 (0: 첫 시도)
  const correctFirstTryRef = useRef(0);
  const roundRef = useRef(0);
  const finishedRef = useRef(false);

  const schedule = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    beginRound(0);
    return () => timeoutsRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const round = rounds[roundIndex];
  const info = MODE_INFO[round.mode];
  const expectedOf = (r: Round) => (r.mode === "backward" ? [...r.seq].reverse() : r.seq);

  // 순서를 보여주고 건반 치기 단계로 넘어갑니다.
  const startListen = (idx: number) => {
    const r = rounds[idx];
    setInput([]);
    setLastOk(null);
    setLit(null);
    if (r.mode === "text") {
      setPhase("play");
      setMessage(MODE_INFO.text.playMsg);
      return;
    }
    setPhase("listen");

    // 글자 기억: 글자를 한꺼번에 보여주고, 시간이 지나면 글자를 없애고 건반 치기 단계로 넘어갑니다.
    if (r.mode === "recall") {
      setMessage("👀 글자를 한꺼번에 잘 보고 기억해요!");
      schedule(() => {
        setPhase("play");
        setMessage(MODE_INFO.recall.playMsg);
      }, recallShowMs(r.seq.length));
      return;
    }
    setMessage("👀 잘 보고 기억해요!");
    let t = 700;
    r.seq.forEach((key) => {
      schedule(() => {
        setLit(key);
        playNote(KEYS[key].freq);
      }, t);
      schedule(() => setLit(null), t + timing.showMs);
      t += timing.showMs + timing.gapMs;
    });
    schedule(() => {
      setPhase("play");
      setMessage(MODE_INFO[r.mode].playMsg);
    }, t);
  };

  // 새 판 시작: 방식이 바뀌면 잠깐 방식 안내를 보여줍니다.
  const beginRound = (idx: number) => {
    attemptRef.current = 0;
    setReplayUsed(false);
    const r = rounds[idx];
    const changed = idx === 0 || rounds[idx - 1].mode !== r.mode;
    if (changed) {
      setPhase("intro");
      setInput([]);
      setLit(null);
      setLastOk(null);
      setMessage(MODE_INFO[r.mode].howto);
      schedule(() => startListen(idx), 2600);
    } else {
      startListen(idx);
    }
  };

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
    setRoundIndex(next);
    beginRound(next);
  };

  const pressKey = (key: number) => {
    if (phase !== "play") return;
    // 칠 때마다 그 음이 소리 나고 건반이 반짝여서 "눌렸다"는 것을 바로 알 수 있어요.
    playNote(KEYS[key].freq);
    setPressed(key);
    schedule(() => setPressed(null), 260);

    const expected = expectedOf(round);
    const next = [...input, key];
    setInput(next);

    if (key !== expected[input.length]) {
      // 틀렸을 때: 같은 순서를 한 번 더 보여주고 다시 도전해요.
      setLastOk(false);
      fx.miss("앗!");
      setPhase("feedback");
      if (attemptRef.current === 0) {
        attemptRef.current = 1;
        setMessage(
          round.mode === "text"
            ? `앗, ${KEYS[key].label}이(가) 아니에요. 글자를 다시 보고 쳐 봐요!`
            : round.mode === "recall"
              ? "앗, 다른 건반이에요. 글자를 다시 보여줄게요! 👀"
              : "앗, 다른 건반이에요. 다시 한 번 보여줄게요! 👀"
        );
        schedule(() => startListen(roundRef.current), 1700);
      } else {
        setMessage("괜찮아요! 다음 곡으로 가요 🎵");
        schedule(nextRound, 1500);
      }
      return;
    }

    if (next.length === expected.length) {
      if (attemptRef.current === 0) correctFirstTryRef.current += 1;
      setLastOk(true);
      fx.hit("딩동댕!");
      setPhase("feedback");
      setMessage("딩동댕~ 멋지게 연주했어요! 🎉");
      schedule(nextRound, 1500);
    }
  };

  // 글자 기억 방식에서는 글자를 한 번 더 볼 수 있어요(힌트를 쓰면 첫 시도 점수에는 넣지 않아요).
  const replay = () => {
    if (phase !== "play" || round.mode !== "recall") return;
    attemptRef.current = 1;
    setReplayUsed(true);
    startListen(roundRef.current);
  };

  const expected = expectedOf(round);
  const hideLabels = round.mode === "position";

  return (
    <div className={`relative flex flex-col items-center gap-4 text-center ${shakeClass(fx)}`}>
      <FxOverlay fx={fx} />
      <p className="text-xs text-slate-400">
        {roundIndex + 1} / {rounds.length} · 순서 길이 {round.seq.length}개
      </p>
      <p className="rounded-full bg-white/10 px-4 py-1 text-sm font-bold text-[#a2ffcf]">
        {info.icon} {info.title}
      </p>

      {/* 글자 보고 치기: 칠 음을 글자로 보여주고, 다음에 칠 음을 강조해요 */}
      {round.mode === "text" && phase !== "intro" && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/20">
          {round.seq.map((key, i) => {
            const done = i < input.length && input[i] === key;
            const current = i === input.length;
            return (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-slate-400">→</span>}
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl font-extrabold ${
                    done
                      ? "bg-[#00ff88] text-[#050a18]"
                      : current
                        ? "bg-amber-300 text-amber-950 ring-4 ring-amber-200"
                        : "bg-white/15 text-white"
                  }`}
                >
                  {KEYS[key].label}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* 글자 기억: 글자를 한꺼번에 보여줬다가 없애요 (없어진 뒤에는 물음표 칸만 남아요) */}
      {round.mode === "recall" && phase !== "intro" && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/20">
          {round.seq.map((key, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-slate-400">→</span>}
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl font-extrabold ${
                  phase === "listen" ? "bg-white/15 text-white" : "border-2 border-dashed border-white/30 text-slate-500"
                }`}
              >
                {phase === "listen" ? KEYS[key].label : "?"}
              </span>
            </span>
          ))}
        </div>
      )}

      <p
        className={`min-h-[3rem] text-base font-bold ${
          lastOk === null ? "text-slate-100" : lastOk ? "text-[#00ff88]" : "text-amber-300"
        }`}
        aria-live="polite"
      >
        {message}
      </p>

      <FxHint fx={fx}>
        글자나 위치를 마음속으로 "도-미-솔"처럼 따라 말하면서 기억해 봐요!
        {round.mode === "backward" && " 거꾸로는 마지막 음부터 쳐요."}
      </FxHint>

      <div className="flex w-full justify-center gap-2">
        {KEYS.map((key, i) => {
          const isOn = lit === i || pressed === i;
          const base = hideLabels ? "#64748b" : key.color;
          return (
            <button
              key={key.label}
              type="button"
              disabled={phase !== "play"}
              onClick={() => pressKey(i)}
              className="flex h-40 flex-1 flex-col items-center justify-end rounded-2xl pb-4 text-xl font-extrabold text-white transition-all disabled:opacity-100"
              style={{
                backgroundColor: isOn ? (hideLabels ? "#facc15" : key.color) : `${base}55`,
                boxShadow: isOn ? `0 0 28px ${hideLabels ? "#facc15" : key.color}` : "none",
                transform: isOn ? "translateY(-6px) scale(1.03)" : "none",
                color: isOn && hideLabels ? "#422006" : undefined,
              }}
              aria-label={hideLabels ? `건반 ${i + 1}번` : key.label}
            >
              {hideLabels ? "♪" : key.label}
            </button>
          );
        })}
      </div>

      {/* 내가 친 음: 칠 때마다 바로 보여줘요 (맞으면 초록, 틀리면 노랑) */}
      <div className="flex min-h-[2.5rem] items-center justify-center gap-2" aria-label="내가 친 음">
        {Array.from({ length: expected.length }, (_, i) => {
          const typed = input[i];
          if (typed === undefined) {
            return (
              <span key={i} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-slate-500">
                ○
              </span>
            );
          }
          const ok = typed === expected[i];
          return (
            <span
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-base font-extrabold ${
                ok ? "bg-[#00ff88] text-[#050a18]" : "bg-amber-400 text-amber-950"
              }`}
            >
              {KEYS[typed].label}
            </span>
          );
        })}
      </div>

      {round.mode === "recall" && phase === "play" && !replayUsed && (
        <button
          type="button"
          onClick={replay}
          className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
        >
          🔁 한 번 더 보기 (힌트)
        </button>
      )}
    </div>
  );
}
