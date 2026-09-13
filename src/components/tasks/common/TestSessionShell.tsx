"use client";

import { useState } from "react";
import Link from "next/link";
import type { TestPhase } from "@/types";

// 모든 검사가 공통으로 따르는 진행 순서 (섹션 7)
const PHASE_ORDER: TestPhase[] = [
  "intro",
  "practice",
  "practiceResult",
  "ready",
  "main",
  "complete",
  "result",
];

interface TestSessionShellProps {
  title: string;
  /** 각 단계(phase)에 맞는 화면을 그려주는 함수. goToNext를 호출하면 다음 단계로 넘어갑니다. */
  renderPhase: (phase: TestPhase, goToNext: () => void) => React.ReactNode;
}

/**
 * 검사 공통 엔진 (뼈대).
 * intro → practice → practiceResult → ready → main → complete → result 순서를 관리합니다.
 * 실제 문항 내용(자극, 정답 판정 등)은 각 검사 컴포넌트가 renderPhase를 통해 채워 넣습니다.
 *
 * "practice"와 "main" 단계에서는 학생이 검사에만 집중할 수 있도록
 * 상단 메뉴/푸터를 화면 전체를 덮는 레이어로 가립니다 (섹션 3).
 */
export default function TestSessionShell({ title, renderPhase }: TestSessionShellProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = PHASE_ORDER[phaseIndex];

  const goToNext = () => {
    setPhaseIndex((idx) => Math.min(idx + 1, PHASE_ORDER.length - 1));
  };

  const isFocusedPhase = phase === "practice" || phase === "main";

  if (isFocusedPhase) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-xl">{renderPhase(phase, goToNext)}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <Link href="/tests" className="text-sm text-slate-400 hover:underline">
          검사 목록으로
        </Link>
      </div>
      {renderPhase(phase, goToNext)}
    </div>
  );
}
