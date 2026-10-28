"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameShell";
import { FxHint, FxOverlay, shakeClass, useFx } from "../feedbackFx";

/**
 * 청기백기 깃발 대장 (억제통제 놀이).
 * 깃발 대장의 말은 그대로 따라 하고, 도깨비의 말은 따라 하지 않고 참습니다(Simon says 방식의 반응 억제).
 * 3단계에는 "반대 대장"이 나와 말한 것과 반대로 눌러야 해서, 습관적인 반응을 누르고 다른 반응을 하는 연습도 합니다.
 * ⚠️ 놀이이므로 정답을 바로 알려줍니다. 결과는 별 개수 외에 저장하지 않습니다.
 */

type Kind = "normal" | "ghost" | "reverse";
type Flag = "blue" | "white";
type Action = "up" | "down";

interface Trial {
  kind: Kind;
  flag: Flag;
  action: Action;
}

// 단계별 설정: 문항 수, 도깨비 비율, 반대 대장 비율, 반응 시간(ms), 쓰는 동작
const CONFIG = {
  1: { n: 8, ghost: 0.35, reverse: 0, windowMs: 3000, actions: ["up"] as Action[] },
  2: { n: 12, ghost: 0.4, reverse: 0, windowMs: 2200, actions: ["up", "down"] as Action[] },
  3: { n: 16, ghost: 0.3, reverse: 0.3, windowMs: 1900, actions: ["up", "down"] as Action[] },
} as const;

const FLAG_NAME: Record<Flag, string> = { blue: "청기", white: "백기" };
const ACTION_NAME: Record<Action, string> = { up: "올려", down: "내려" };
const SPEAKER: Record<Kind, { icon: string; name: string }> = {
  normal: { icon: "🧑‍✈️", name: "깃발 대장" },
  ghost: { icon: "👹", name: "도깨비" },
  reverse: { icon: "🔄", name: "반대 대장" },
};

function opposite(action: Action): Action {
  return action === "up" ? "down" : "up";
}

function makeTrials(level: 1 | 2 | 3): Trial[] {
  const cfg = CONFIG[level];
  const ghostCount = Math.round(cfg.n * cfg.ghost);
  const reverseCount = Math.round(cfg.n * cfg.reverse);
  const kinds: Kind[] = [
    ...Array<Kind>(ghostCount).fill("ghost"),
    ...Array<Kind>(reverseCount).fill("reverse"),
    ...Array<Kind>(cfg.n - ghostCount - reverseCount).fill("normal"),
  ];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return kinds.map((kind) => ({
    kind,
    flag: Math.random() < 0.5 ? "blue" : "white",
    action: cfg.actions[Math.floor(Math.random() * cfg.actions.length)],
  }));
}

export default function FlagGame({ level, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const fx = useFx();
  const [trials] = useState<Trial[]>(() => makeTrials(level));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"wait" | "command" | "feedback">("wait");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [up, setUp] = useState<Record<Flag, boolean>>({ blue: false, white: false });

  const phaseRef = useRef<"wait" | "command" | "feedback">("wait");
  const indexRef = useRef(0);
  const correctRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishedRef = useRef(false);

  const changePhase = (next: "wait" | "command" | "feedback") => {
    phaseRef.current = next;
    setPhase(next);
  };
  const schedule = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(setTimeout(fn, ms));
  };

  const beginTrial = () => {
    setFeedback(null);
    changePhase("wait");
    schedule(() => {
      changePhase("command");
      schedule(onTimeout, cfg.windowMs);
    }, 800);
  };

  useEffect(() => {
    beginTrial();
    return () => timeoutsRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endTrial = (ok: boolean, text: string) => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (ok) correctRef.current += 1;
    const ghostPressed = text.includes("도깨비 말이에요");
    if (ok) fx.hit("통과!");
    else fx.miss(ghostPressed ? "쿵!" : "앗!", ghostPressed);
    setFeedback({ ok, text });
    changePhase("feedback");
    schedule(() => {
      const next = indexRef.current + 1;
      if (next >= trials.length) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinish({ correct: correctRef.current, total: trials.length });
        }
        return;
      }
      indexRef.current = next;
      setIndex(next);
      beginTrial();
    }, 1200);
  };

  const onTimeout = () => {
    if (phaseRef.current !== "command") return;
    const trial = trials[indexRef.current];
    if (trial.kind === "ghost") endTrial(true, "잘 참았어요! 도깨비 말은 따라 하지 않아요 👍");
    else endTrial(false, "시간이 지났어요. 대장 말은 따라 해야 해요!");
  };

  const press = (flag: Flag, action: Action) => {
    if (phaseRef.current !== "command") return;
    const trial = trials[indexRef.current];
    if (trial.kind === "ghost") {
      endTrial(false, "앗! 도깨비 말이에요. 따라 하면 안 돼요!");
      return;
    }
    const expected = trial.kind === "reverse" ? opposite(trial.action) : trial.action;
    if (flag === trial.flag && action === expected) {
      setUp((prev) => ({ ...prev, [flag]: action === "up" }));
      endTrial(true, "딱 맞아요! 👍");
    } else if (trial.kind === "reverse" && flag === trial.flag && action === trial.action) {
      endTrial(false, "반대 대장은 말한 것과 반대로 해야 해요!");
    } else {
      endTrial(false, "다른 깃발이에요. 다음엔 잘 들어 봐요!");
    }
  };

  const trial = trials[index];
  const speaker = SPEAKER[trial.kind];
  const buttons = cfg.actions.flatMap((action) => (["blue", "white"] as Flag[]).map((flag) => ({ flag, action })));

  return (
    <div className={`relative flex flex-col items-center gap-4 text-center ${shakeClass(fx)}`}>
      <FxOverlay fx={fx} />
      <p className="text-xs text-slate-400">
        {Math.min(index + 1, trials.length)} / {trials.length}
      </p>

      {/* 깃발 */}
      <div className="flex h-28 w-full items-end justify-center gap-12 rounded-2xl bg-white/5 pb-2 ring-1 ring-white/15">
        {(["blue", "white"] as Flag[]).map((flag) => (
          <div key={flag} className="relative h-24 w-14">
            <div className="absolute bottom-0 left-1/2 h-24 w-1 -translate-x-1/2 bg-slate-400" />
            <div
              className={`absolute left-1/2 flex h-8 w-12 items-center justify-center rounded-sm text-[11px] font-bold transition-all duration-300 ${
                flag === "blue" ? "bg-sky-500 text-white" : "bg-white text-slate-700"
              }`}
              style={{ bottom: up[flag] ? 56 : 0 }}
            >
              {FLAG_NAME[flag]}
            </div>
          </div>
        ))}
      </div>

      {/* 말하는 사람 + 명령 */}
      <div className="min-h-[6.5rem] w-full rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
        {phase === "command" || phase === "feedback" ? (
          <>
            <p className="text-sm text-slate-300">
              <span aria-hidden="true">{speaker.icon}</span> {speaker.name}
            </p>
            <p className="mt-1 text-3xl font-extrabold text-white">
              {FLAG_NAME[trial.flag]} {ACTION_NAME[trial.action]}!
            </p>
          </>
        ) : (
          <p className="pt-6 text-sm text-slate-300">🎤 누가 말할까요?</p>
        )}
      </div>

      <p
        className={`min-h-[2.5rem] text-base font-bold ${
          feedback ? (feedback.ok ? "text-[#00ff88]" : "text-amber-300") : "text-slate-300"
        }`}
        aria-live="polite"
      >
        {feedback ? feedback.text : phase === "command" ? "도깨비면 누르지 말고 참아요!" : ""}
      </p>

      <FxHint fx={fx}>도깨비 말은 참기 · 깃발 대장은 말한 그대로 · 반대 대장은 반대로!</FxHint>

      <div className={`grid w-full gap-3 ${buttons.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
        {buttons.map(({ flag, action }) => (
          <button
            key={`${flag}-${action}`}
            type="button"
            disabled={phase !== "command"}
            onClick={() => press(flag, action)}
            className={`rounded-2xl px-4 py-5 text-lg font-extrabold transition-colors disabled:opacity-60 ${
              flag === "blue" ? "bg-sky-500 text-white hover:bg-sky-400" : "bg-white text-slate-800 hover:bg-slate-200"
            }`}
          >
            {flag === "blue" ? "🔵" : "⚪"} {FLAG_NAME[flag]} {ACTION_NAME[action]}
          </button>
        ))}
      </div>
    </div>
  );
}
