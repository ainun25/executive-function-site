"use client";

import { useCallback, useRef } from "react";

/**
 * 반응시간 측정 규칙 (섹션 8, 23)
 * - Date.now()가 아닌 performance.now()로 밀리초 단위 측정
 * - 자극은 requestAnimationFrame으로 "실제로 화면에 그려진 시점"을 기준으로 시각 기록
 * - 한 문항(trial)당 최대 한 번의 응답만 인정
 */

export interface TrialTimer {
  /** 자극을 화면에 표시하는 시점에 호출합니다. 다음 프레임에 실제 onset 시각을 기록합니다. */
  armStimulus: () => void;
  /** 사용자 응답 시점에 호출합니다. 이미 응답했거나 자극이 아직 표시되지 않았다면 null을 반환합니다. */
  recordResponse: () => number | null;
  /** 이번 trial에서 이미 응답이 기록되었는지 확인합니다. */
  hasResponded: () => boolean;
  /** 다음 trial을 위해 상태를 초기화합니다. */
  reset: () => void;
}

// 검사 컴포넌트에서 공통으로 사용하는 반응시간 측정 훅
export function useTrialTimer(): TrialTimer {
  const onsetTimeRef = useRef<number | null>(null);
  const respondedRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const armStimulus = useCallback(() => {
    respondedRef.current = false;
    onsetTimeRef.current = null;
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      onsetTimeRef.current = performance.now();
    });
  }, []);

  const recordResponse = useCallback(() => {
    // 자극이 표시되기 전에 누른 반응(anticipatory 이전 단계)이나
    // 한 trial에서 중복으로 들어온 두 번째 이상의 반응은 인정하지 않습니다.
    if (respondedRef.current || onsetTimeRef.current === null) return null;
    respondedRef.current = true;
    return performance.now() - onsetTimeRef.current;
  }, []);

  const hasResponded = useCallback(() => respondedRef.current, []);

  const reset = useCallback(() => {
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    onsetTimeRef.current = null;
    respondedRef.current = false;
  }, []);

  return { armStimulus, recordResponse, hasResponded, reset };
}

// 검사 시작 전 이미지들을 미리 불러와, 네트워크 지연이 반응시간을 왜곡하지 않도록 합니다.
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // 이미지 하나가 실패해도 검사 전체를 막지 않음
          img.src = url;
        })
    )
  );
}
