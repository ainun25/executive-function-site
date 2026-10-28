"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 놀이(훈련) 게임의 즉각 피드백 연출입니다: 효과음, 진동, "통과!/쿵!" 팝업, 화면 흔들림, 연속 성공 표시, 힌트.
// 훈련은 검사와 달리 "바로 알려주는 것"이 핵심이라, 맞았을 때와 틀렸을 때 모두 분명하게 보여줍니다.
// 틀렸을 때도 벌점이나 비난 없이 이유를 알려주고 다시 도전하도록 합니다.

const MUTE_KEY = "ef-site:play-muted";

export function isFxMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setFxMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // 저장할 수 없어도 놀이는 계속할 수 있어요.
  }
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      audioCtx = Ctor ? new Ctor() : null;
    }
    if (audioCtx?.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, type: OscillatorType, volume: number) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + start;
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  } catch {
    // 소리가 나지 않아도 괜찮아요.
  }
}

export type FxKind = "good" | "streak" | "bad" | "crash";

export function playFx(kind: FxKind): void {
  if (isFxMuted()) return;
  if (kind === "good") {
    tone(660, 0, 0.14, "sine", 0.18);
    tone(880, 0.1, 0.22, "sine", 0.18);
  } else if (kind === "streak") {
    tone(660, 0, 0.12, "sine", 0.18);
    tone(880, 0.09, 0.12, "sine", 0.18);
    tone(1175, 0.18, 0.28, "sine", 0.18);
  } else if (kind === "bad") {
    tone(220, 0, 0.18, "triangle", 0.22);
    tone(180, 0.14, 0.22, "triangle", 0.22);
  } else {
    tone(110, 0, 0.35, "sawtooth", 0.25);
    tone(70, 0.05, 0.4, "square", 0.18);
  }
  if (kind === "bad" || kind === "crash") {
    try {
      navigator.vibrate?.(kind === "crash" ? [80, 40, 80] : 60);
    } catch {
      // 진동을 지원하지 않는 기기에서는 무시합니다.
    }
  }
}

export interface FxBurst {
  key: number;
  ok: boolean;
  label: string;
  crash: boolean;
}

export interface Fx {
  burst: FxBurst | null;
  shaking: boolean;
  streak: number; // 연속 성공 횟수
  misses: number; // 연속으로 틀린 횟수 (맞으면 0으로 돌아감)
  hit: (label?: string) => void;
  miss: (label?: string, crash?: boolean) => void;
}

export function useFx(): Fx {
  const [burst, setBurst] = useState<FxBurst | null>(null);
  const [shaking, setShaking] = useState(false);
  const [streak, setStreak] = useState(0);
  const [misses, setMisses] = useState(0);
  const keyRef = useRef(0);
  const streakRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  const show = useCallback((ok: boolean, label: string, crash: boolean) => {
    keyRef.current += 1;
    setBurst({ key: keyRef.current, ok, label, crash });
    timeoutsRef.current.push(setTimeout(() => setBurst(null), 1000));
    if (!ok) {
      setShaking(true);
      timeoutsRef.current.push(setTimeout(() => setShaking(false), 450));
    }
  }, []);

  const hit = useCallback(
    (label = "통과!") => {
      streakRef.current += 1;
      setStreak(streakRef.current);
      setMisses(0);
      playFx(streakRef.current > 0 && streakRef.current % 3 === 0 ? "streak" : "good");
      show(true, label, false);
    },
    [show]
  );

  const miss = useCallback(
    (label = "앗!", crash = false) => {
      streakRef.current = 0;
      setStreak(0);
      setMisses((m) => m + 1);
      playFx(crash ? "crash" : "bad");
      show(false, label, crash);
    },
    [show]
  );

  return { burst, shaking, streak, misses, hit, miss };
}

/** 게임 화면 위에 겹쳐 보이는 "통과!/쿵!" 팝업과 연속 성공 표시입니다. 부모는 relative여야 합니다. */
export function FxOverlay({ fx }: { fx: Fx }) {
  return (
    <>
      {fx.streak >= 3 && (
        <p className="absolute right-0 top-0 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-extrabold text-amber-950">
          🔥 {fx.streak}연속!
        </p>
      )}
      {fx.burst && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden="true">
          <p
            key={fx.burst.key}
            className={`ef-pop rounded-3xl px-6 py-3 text-3xl font-extrabold shadow-lg ${
              fx.burst.ok ? "bg-[#00ff88] text-[#050a18]" : "bg-amber-400 text-amber-950"
            }`}
          >
            {fx.burst.ok ? "✅" : fx.burst.crash ? "💥" : "🙈"} {fx.burst.label}
          </p>
        </div>
      )}
    </>
  );
}

/** 연속으로 2번 틀렸을 때 나오는 힌트 상자입니다. */
export function FxHint({ fx, children }: { fx: Fx; children: React.ReactNode }) {
  if (fx.misses < 2) return null;
  return (
    <p className="w-full rounded-xl bg-amber-400/15 px-3 py-2 text-xs leading-relaxed text-amber-200 ring-1 ring-amber-300/40">
      💡 힌트: {children}
    </p>
  );
}

export function shakeClass(fx: Fx): string {
  return fx.shaking ? "ef-shake" : "";
}
