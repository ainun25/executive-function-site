"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../GameShell";
import { FxHint, FxOverlay, shakeClass, useFx, MessageBar } from "../feedbackFx";

/**
 * 조건에 맞는 동굴 항해 (인지적 유연성 놀이).
 * 항해 지도(견본)와 "지금 규칙"(색깔/모양/개수)이 같은 동굴을 고릅니다. 폭풍이 오면 규칙이 바뀝니다.
 * 규칙은 한동안 이어지다가 바뀌고, 바뀔 때마다 안내가 나옵니다.
 * 단계가 오를수록 단서를 줄입니다: 1~2단계는 규칙 표시가 항상 보이고, 3단계는 규칙이 바뀔 때만 잠깐 보여줘요.
 * ⚠️ 놀이이므로 정답을 바로 알려줍니다. 결과는 별 개수 외에 저장하지 않습니다.
 */

type Dim = "color" | "shape" | "count";
interface Cave {
  color: number;
  shape: number;
  count: number; // 1~3
}

const COLORS = [
  { hex: "#f43f5e", name: "빨강" },
  { hex: "#0ea5e9", name: "파랑" },
  { hex: "#10b981", name: "초록" },
];
const SHAPES = ["원", "세모", "네모"];
const COUNT_NAMES = ["", "하나", "둘", "셋"];
const DIM_NAME: Record<Dim, string> = { color: "색깔", shape: "모양", count: "개수" };
const DIM_ICON: Record<Dim, string> = { color: "🎨", shape: "🔷", count: "🔢" };

// 단계별 설정: 규칙이 이어지는 길이(run) 목록, 동굴 수, 쓰는 규칙, 규칙 표시를 계속 보여줄지
const CONFIG = {
  1: { runs: [4, 4] as number[], dims: ["color", "shape"] as Dim[], options: 2, alwaysShowRule: true },
  2: { runs: [4, 4, 2, 2] as number[], dims: ["color", "shape"] as Dim[], options: 3, alwaysShowRule: true },
  3: { runs: [3, 3, 3, 2, 2, 2] as number[], dims: ["color", "shape", "count"] as Dim[], options: 3, alwaysShowRule: false },
} as const;

interface TrialSpec {
  rule: Dim;
  target: Cave;
  options: Cave[];
  correctIndex: number;
  firstOfRun: boolean;
}

function rand(n: number) {
  return Math.floor(Math.random() * n);
}
function size(dim: Dim) {
  return dim === "color" ? COLORS.length : dim === "shape" ? SHAPES.length : 3;
}
function get(cave: Cave, dim: Dim) {
  return dim === "count" ? cave.count - 1 : cave[dim];
}
function set(cave: Cave, dim: Dim, value: number): Cave {
  return dim === "count" ? { ...cave, count: value + 1 } : { ...cave, [dim]: value };
}

function makeTrials(level: 1 | 2 | 3): TrialSpec[] {
  const cfg = CONFIG[level];
  const trials: TrialSpec[] = [];
  let ruleIndex = 0;
  cfg.runs.forEach((runLength) => {
    const rule = cfg.dims[ruleIndex % cfg.dims.length];
    ruleIndex += 1;
    for (let i = 0; i < runLength; i++) {
      const target: Cave = { color: rand(3), shape: rand(3), count: 1 + rand(3) };
      // 정답 동굴: 규칙 속성만 견본과 같고, 나머지 속성은 일부러 다르게 만들어 헷갈리지 않게 합니다.
      let correct = target;
      (["color", "shape", "count"] as Dim[]).forEach((dim) => {
        if (dim === rule) return;
        correct = set(correct, dim, (get(target, dim) + 1 + rand(size(dim) - 1)) % size(dim));
      });
      // 오답 동굴: 규칙 속성은 다르고, 다른 속성은 견본과 같게 해서 "다른 규칙으로 보면 맞는 동굴"을 섞어 줍니다.
      const options: Cave[] = [correct];
      while (options.length < cfg.options) {
        let wrong = target;
        wrong = set(wrong, rule, (get(target, rule) + 1 + rand(size(rule) - 1)) % size(rule));
        const isDuplicate = options.some((o) => o.color === wrong.color && o.shape === wrong.shape && o.count === wrong.count);
        if (!isDuplicate) options.push(wrong);
        else if (options.length < cfg.options) {
          // 속성을 하나 더 바꿔 중복을 피합니다.
          const other = (["color", "shape", "count"] as Dim[]).filter((d) => d !== rule)[rand(2)];
          wrong = set(wrong, other, (get(wrong, other) + 1) % size(other));
          if (!options.some((o) => o.color === wrong.color && o.shape === wrong.shape && o.count === wrong.count)) options.push(wrong);
        }
      }
      const order = options.map((_, idx) => idx).sort(() => Math.random() - 0.5);
      const shuffled = order.map((idx) => options[idx]);
      trials.push({
        rule,
        target,
        options: shuffled,
        correctIndex: order.indexOf(0),
        firstOfRun: i === 0,
      });
    }
  });
  return trials;
}

function CaveCard({ cave, large }: { cave: Cave; large?: boolean }) {
  const color = COLORS[cave.color].hex;
  const px = large ? 34 : 28;
  const shape = (key: number) => {
    const s = SHAPES[cave.shape];
    if (s === "원") return <span key={key} className="inline-block rounded-full" style={{ width: px, height: px, backgroundColor: color }} />;
    if (s === "네모") return <span key={key} className="inline-block rounded-md" style={{ width: px, height: px, backgroundColor: color }} />;
    return (
      <span
        key={key}
        className="inline-block"
        style={{
          width: 0,
          height: 0,
          borderLeft: `${px / 2}px solid transparent`,
          borderRight: `${px / 2}px solid transparent`,
          borderBottom: `${px}px solid ${color}`,
        }}
      />
    );
  };
  return (
    <div
      className="flex flex-col items-center justify-center gap-1"
      role="img"
      aria-label={`${COLORS[cave.color].name} ${SHAPES[cave.shape]} ${cave.count}개`}
    >
      <div className="flex gap-1">{Array.from({ length: cave.count }, (_, i) => shape(i))}</div>
      <span className="text-[11px] font-semibold text-slate-200">
        {COLORS[cave.color].name} {SHAPES[cave.shape]} {cave.count}개
      </span>
    </div>
  );
}

export default function CaveGame({ level, onFinish }: GameProps) {
  const cfg = CONFIG[level];
  const fx = useFx();
  const [trials] = useState<TrialSpec[]>(() => makeTrials(level));
  const [index, setIndex] = useState(0);
  const [announcing, setAnnouncing] = useState(true);
  const [announceReady, setAnnounceReady] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const correctRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishedRef = useRef(false);

  const schedule = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(setTimeout(fn, ms));
  };
  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  // 규칙이 시작되거나 바뀔 때 안내를 보여줍니다 (잠깐 기다린 뒤 "알겠어요" 활성화).
  useEffect(() => {
    if (trials[index].firstOfRun) {
      setAnnouncing(true);
      setAnnounceReady(false);
      schedule(() => setAnnounceReady(true), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const trial = trials[index];
  const prevRule = index > 0 ? trials[index - 1].rule : null;
  // 2번 연속 틀리면 규칙을 다시 보여줍니다(힌트).
  const showRule = cfg.alwaysShowRule || trial.firstOfRun || fx.misses >= 2;

  const choose = (optionIndex: number) => {
    if (feedback || announcing) return;
    const ok = optionIndex === trial.correctIndex;
    if (ok) correctRef.current += 1;
    if (ok) fx.hit("통과!");
    else fx.miss("쿵!", true);
    setFeedback(
      ok
        ? { ok: true, text: "🎉 통과! 딱 맞는 동굴이에요" }
        : { ok: false, text: `쿵! 지금은 "${DIM_NAME[trial.rule]}"이 같은 동굴이에요` }
    );
    schedule(() => {
      setFeedback(null);
      if (index + 1 >= trials.length) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinish({ correct: correctRef.current, total: trials.length });
        }
        return;
      }
      setIndex(index + 1);
    }, ok ? 900 : 1700);
  };

  if (announcing) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-5xl" aria-hidden="true">
          {prevRule ? "🌪️" : "🗺️"}
        </p>
        <p className="text-lg font-extrabold text-[#00ff88]">
          {prevRule ? "폭풍이 왔어요! 지도가 바뀌었어요" : "항해 지도를 펼쳐요"}
        </p>
        <div className="w-full rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
          <p className="text-xs text-slate-300">지금부터 규칙</p>
          <p className="mt-1 text-3xl font-extrabold text-white">
            {DIM_ICON[trial.rule]} {DIM_NAME[trial.rule]}이 같은 동굴
          </p>
          <p className="mt-2 text-xs text-slate-300">
            {trial.rule === "color" && "지도 그림과 색깔이 같은 동굴을 골라요."}
            {trial.rule === "shape" && "지도 그림과 모양이 같은 동굴을 골라요."}
            {trial.rule === "count" && "지도 그림과 개수가 같은 동굴을 골라요."}
          </p>
        </div>
        {!cfg.alwaysShowRule && (
          <p className="text-xs text-amber-300">이번 단계는 규칙을 잠깐만 보여줘요. 잘 기억해요!</p>
        )}
        <button
          type="button"
          disabled={!announceReady}
          onClick={() => setAnnouncing(false)}
          className="w-full rounded-full bg-indigo-500 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          {announceReady ? "알겠어요, 출발!" : "읽는 중..."}
        </button>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center gap-4 text-center ${shakeClass(fx)}`}>
      <FxOverlay fx={fx} />
      <p className="text-xs text-slate-400">
        {index + 1} / {trials.length}
      </p>

      <div className="w-full rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
        <p className="text-xs text-slate-300">🗺️ 항해 지도</p>
        <div className="mt-2 flex justify-center">
          <CaveCard cave={trial.target} large />
        </div>
        <p className={`mt-2 text-sm font-bold ${showRule ? "text-[#00ff88]" : "text-slate-500"}`}>
          {showRule ? `${DIM_ICON[trial.rule]} 규칙: ${DIM_NAME[trial.rule]}이 같은 동굴` : "🙈 규칙을 기억해서 골라요"}
        </p>
      </div>

      <MessageBar tone={feedback ? (feedback.ok ? "good" : "bad") : "info"}>
        {feedback ? feedback.text : "⛵ 어느 동굴로 들어갈까요?"}
      </MessageBar>
      <FxHint fx={fx}>지도 그림과 "{DIM_NAME[trial.rule]}"이 같은 동굴을 골라요!</FxHint>

      <div className={`grid w-full gap-3 ${cfg.options === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {trial.options.map((option, i) => (
          <button
            key={i}
            type="button"
            disabled={!!feedback}
            onClick={() => choose(i)}
            className={`flex min-h-[7rem] items-center justify-center rounded-t-[3rem] rounded-b-xl border-4 bg-[#0b1230] p-2 transition-colors ${
              feedback && i === trial.correctIndex
                ? "border-[#00ff88]"
                : "border-slate-500 hover:border-indigo-300"
            }`}
          >
            <CaveCard cave={option} />
          </button>
        ))}
      </div>
    </div>
  );
}
