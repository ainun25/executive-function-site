"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameShell";
import { FxHint, FxOverlay, shakeClass, useFx } from "../feedbackFx";

/**
 * 청기백기 깃발 대장 (억제통제 놀이).
 * 깃발 대장의 말은 그대로 따라 하고, 도깨비의 말은 따라 하지 않고 참습니다(Simon says 방식의 반응 억제).
 * 3단계에는 "반대 대장"이 나와 말한 것과 반대로 눌러야 해서, 습관적인 반응을 누르고 다른 반응을 하는 연습도 합니다.
 *
 * 깃발은 문항마다 "가운데"에서 시작합니다. 그래서 올리기와 내리기가 언제나 둘 다 가능하고,
 * 깃발의 현재 모양으로 답을 짐작할 수 없어 지시를 정확히 들어야 합니다.
 * 응답이 끝나면 깃발은 다시 가운데로 돌아옵니다.
 * ⚠️ 놀이이므로 정답을 바로 알려줍니다. 결과는 별 개수 외에 저장하지 않습니다.
 */

type Kind = "normal" | "ghost" | "reverse";
type Flag = "blue" | "white";
type Action = "up" | "down";
type Pos = "up" | "mid" | "down";

interface Spec {
  flag: Flag;
  spoken: Action; // 말하는 사람이 한 말 ("올려"/"내려")
  expected: Action; // 실제로 눌러야 하는 동작 (반대 대장이면 말한 것의 반대)
}

const MID: Record<Flag, Pos> = { blue: "mid", white: "mid" };
const POS_LABEL: Record<Pos, string> = { up: "올라감 ⬆️", mid: "가운데", down: "내려감 ⬇️" };
const POS_BOTTOM: Record<Pos, number> = { down: 0, mid: 28, up: 56 };

// 단계별 설정: 문항 수, 도깨비 비율, 반대 대장 비율, 반응 시간(ms), "내려" 지시를 쓰는지
const CONFIG = {
  1: { n: 8, ghost: 0.35, reverse: 0, windowMs: 3200, useDown: false },
  2: { n: 12, ghost: 0.4, reverse: 0, windowMs: 2400, useDown: true },
  3: { n: 16, ghost: 0.3, reverse: 0.3, windowMs: 2100, useDown: true },
} as const;

const FLAG_NAME: Record<Flag, string> = { blue: "청기", white: "백기" };
const ACTION_NAME: Record<Action, string> = { up: "올려", down: "내려" };

// 말하는 사람: 크게 보이도록 큰 얼굴, 이름, 역할 한 줄, 색 테두리로 구분합니다.
const SPEAKER: Record<Kind, { icon: string; name: string; role: string; box: string }> = {
  normal: {
    icon: "🧑‍✈️",
    name: "깃발 대장",
    role: "말한 대로 해요!",
    box: "border-[#00ff88] bg-[#00ff88]/10",
  },
  ghost: {
    icon: "👹",
    name: "도깨비",
    role: "따라 하면 안 돼요! 꾹 참아요",
    box: "border-fuchsia-400 bg-fuchsia-500/15",
  },
  reverse: {
    icon: "🙃",
    name: "반대 대장",
    role: "말한 것과 반대로 해요!",
    box: "border-amber-300 bg-amber-400/15",
  },
};

function opposite(action: Action): Action {
  return action === "up" ? "down" : "up";
}

function makeKinds(level: 1 | 2 | 3): Kind[] {
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
  return kinds;
}

export default function FlagGame({ level, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const fx = useFx();
  const [kinds] = useState<Kind[]>(() => makeKinds(level));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"wait" | "command" | "feedback">("wait");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [pos, setPos] = useState<Record<Flag, Pos>>(MID);
  const [spec, setSpec] = useState<Spec | null>(null);

  const phaseRef = useRef<"wait" | "command" | "feedback">("wait");
  const indexRef = useRef(0);
  const specRef = useRef<Spec | null>(null);
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
  // 문항 시작: 깃발을 가운데로 돌려놓고, 어떤 깃발을 올릴지/내릴지 지시를 만듭니다.
  const beginTrial = () => {
    setFeedback(null);
    changePhase("wait");
    setSpec(null);
    specRef.current = null;
    setPos(MID);

    schedule(() => {
      const kind = kinds[indexRef.current];
      const flag: Flag = Math.random() < 0.5 ? "blue" : "white";
      const spoken: Action = cfg.useDown ? (Math.random() < 0.5 ? "up" : "down") : "up";
      // 반대 대장은 말한 것과 반대로 해야 합니다.
      const next: Spec = { flag, spoken, expected: kind === "reverse" ? opposite(spoken) : spoken };
      specRef.current = next;
      setSpec(next);
      changePhase("command");
      schedule(onTimeout, cfg.windowMs);
    }, 900);
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
      if (next >= kinds.length) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinish({ correct: correctRef.current, total: kinds.length });
        }
        return;
      }
      indexRef.current = next;
      setIndex(next);
      beginTrial();
    }, 1300);
  };

  const onTimeout = () => {
    if (phaseRef.current !== "command") return;
    if (kinds[indexRef.current] === "ghost") endTrial(true, "잘 참았어요! 도깨비 말은 따라 하지 않아요 👍");
    else endTrial(false, "시간이 지났어요. 대장 말은 따라 해야 해요!");
  };

  const press = (flag: Flag, action: Action) => {
    if (phaseRef.current !== "command" || !specRef.current) return;
    const kind = kinds[indexRef.current];
    const current = specRef.current;
    if (kind === "ghost") {
      endTrial(false, "앗! 도깨비 말이에요. 따라 하면 안 돼요!");
      return;
    }
    if (flag === current.flag && action === current.expected) {
      setPos({ ...MID, [flag]: action });
      endTrial(true, "딱 맞아요! 👍");
    } else if (kind === "reverse" && flag === current.flag && action === current.spoken) {
      endTrial(false, "반대 대장은 말한 것과 반대로 해야 해요!");
    } else {
      endTrial(false, "다른 깃발이에요. 다음엔 잘 들어 봐요!");
    }
  };

  const kind = kinds[index];
  const speaker = SPEAKER[kind];
  const buttonActions: Action[] = cfg.useDown ? ["up", "down"] : ["up"];
  const buttons = buttonActions.flatMap((action) => (["blue", "white"] as Flag[]).map((flag) => ({ flag, action })));

  return (
    <div className={`relative flex flex-col items-center gap-4 text-center ${shakeClass(fx)}`}>
      <FxOverlay fx={fx} />
      <p className="text-xs text-slate-400">
        {Math.min(index + 1, kinds.length)} / {kinds.length}
      </p>

      {/* 말하는 사람 + 지시: 크게 보여줘서 누가 말하는지 한눈에 알 수 있어요 */}
      {phase === "wait" || !spec ? (
        <div className="flex min-h-[11.5rem] w-full flex-col items-center justify-center rounded-3xl border-4 border-white/20 bg-white/5 p-4">
          <p className="text-6xl" aria-hidden="true">
            🎤
          </p>
          <p className="mt-2 text-lg font-bold text-slate-200">누가 말할까요?</p>
        </div>
      ) : (
        <div className={`flex min-h-[11.5rem] w-full flex-col items-center justify-center rounded-3xl border-4 p-4 ${speaker.box}`}>
          <p className="text-7xl leading-none" aria-hidden="true">
            {speaker.icon}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-white">{speaker.name}</p>
          <p className="mt-1 text-sm font-bold text-slate-100">{speaker.role}</p>
          <p className="mt-3 rounded-2xl bg-black/30 px-6 py-2 text-4xl font-extrabold text-white">
            {FLAG_NAME[spec.flag]} {ACTION_NAME[spec.spoken]}!
          </p>
        </div>
      )}

      {/* 깃발: 지금 올라갔는지 내려갔는지 크게 보여줍니다 (상태 글자는 깃발 아래 따로) */}
      <div className="flex w-full justify-center gap-14 rounded-2xl bg-white/5 py-2 ring-1 ring-white/15">
        {(["blue", "white"] as Flag[]).map((flag) => (
          <div key={flag} className="flex flex-col items-center">
            <div className="relative h-24 w-20">
              <div className="absolute bottom-0 left-1/2 h-24 w-1.5 -translate-x-1/2 rounded bg-slate-400" />
              <div
                className={`absolute left-1/2 flex h-10 w-16 items-center justify-center rounded-sm text-sm font-extrabold transition-all duration-300 ${
                  flag === "blue" ? "bg-sky-500 text-white" : "bg-white text-slate-700"
                }`}
                style={{ bottom: POS_BOTTOM[pos[flag]] }}
              >
                {FLAG_NAME[flag]}
              </div>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-200">
              {FLAG_NAME[flag]} {POS_LABEL[pos[flag]]}
            </p>
          </div>
        ))}
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

      <div className="grid w-full grid-cols-2 gap-3">
        {buttons.map(({ flag, action }) => (
          <button
            key={`${flag}-${action}`}
            type="button"
            disabled={phase !== "command"}
            onClick={() => press(flag, action)}
            className={`rounded-2xl px-4 py-4 text-lg font-extrabold transition-colors disabled:opacity-60 ${
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
