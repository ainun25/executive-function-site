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

/** 피아노 건반 한 음을 소리 냅니다. 건반을 누르는 순간(사용자 동작)에 불러야 브라우저가 소리를 막지 않아요. */
export function playNote(freq: number): void {
  if (isFxMuted()) return;
  tone(freq, 0, 0.55, "sine", 0.22);
}

/** 이 기기(브라우저)가 말소리 읽기(음성 합성)를 지원하는지 확인합니다. */
export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/** 한국어로 짧은 말을 소리 내어 읽고, 다 읽으면 끝납니다(최대 2.5초). 소리가 꺼져 있거나 지원하지 않으면 바로 끝납니다. */
export function speakText(text: string, rate = 0.8): Promise<void> {
  return new Promise((resolve) => {
    if (isFxMuted() || !canSpeak()) {
      resolve();
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = rate;
      utterance.pitch = 1;
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("ko"));
      if (voice) utterance.voice = voice;
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      setTimeout(finish, 2500);
      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

export function cancelSpeech(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // 지원하지 않는 기기에서는 무시합니다.
  }
}

// ---- 미리 만든 음성 파일 재생 (도·레·미·파·솔 말소리) ----
// 브라우저 음성 읽기는 한 글자를 문장처럼 읽어 억양이 어색하고 기기마다 다르므로,
// 짧게 다듬은 음성 파일(public/audio/solfege/*.wav)을 WebAudio로 재생합니다.
// 같은 이름의 파일을 다른 목소리(예: 부모님 녹음)로 바꿔 넣으면 그대로 사용됩니다.

const clipCache = new Map<string, AudioBuffer | null>();
const clipLoading = new Map<string, Promise<AudioBuffer | null>>();

async function loadClip(url: string): Promise<AudioBuffer | null> {
  if (clipCache.has(url)) return clipCache.get(url) ?? null;
  const pending = clipLoading.get(url);
  if (pending) return pending;
  const task = (async () => {
    const ctx = getCtx();
    if (!ctx) return null;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      clipCache.set(url, buffer);
      return buffer;
    } catch {
      return null;
    }
  })();
  clipLoading.set(url, task);
  const result = await task;
  clipLoading.delete(url);
  if (!result) clipCache.set(url, null);
  return result;
}

export function preloadClips(urls: string[]): void {
  urls.forEach((url) => void loadClip(url));
}

/** 모바일 브라우저는 사용자가 누를 때 소리 장치를 "깨워" 줘야 이후 자동 재생 소리가 나옵니다. 버튼을 누르는 순간 부르세요. */
export function unlockAudio(): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // 지원하지 않으면 무시합니다.
  }
}

/** 음성 파일을 재생하고 끝나면 true를 돌려줍니다. 파일을 읽지 못하면 false(호출한 쪽에서 대신할 방법을 쓰세요). */
export async function playClip(url: string): Promise<boolean> {
  const buffer = await loadClip(url);
  const ctx = getCtx();
  if (!buffer || !ctx) return false;
  if (isFxMuted()) return true;
  return new Promise<boolean>((resolve) => {
    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve(true);
        }
      };
      source.onended = finish;
      setTimeout(finish, buffer.duration * 1000 + 400);
      source.start();
    } catch {
      resolve(false);
    }
  });
}
