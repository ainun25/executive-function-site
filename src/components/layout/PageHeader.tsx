import type { ReactNode } from "react";

/**
 * 모든 안내 페이지(알아보기·찾아보기·검사·놀이·내 결과)가 같은 모양의 제목 영역을 쓰도록 만든 공통 부품입니다.
 * 위쪽의 연한 보라색 띠는 홈 화면의 시작 영역과 같은 느낌을 줍니다.
 */
export default function PageHeader({
  emoji,
  title,
  children,
  className = "",
}: {
  emoji: string;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`text-center ${className}`}>
      <span
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-3xl ring-1 ring-indigo-100"
        aria-hidden="true"
      >
        {emoji}
      </span>
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900 sm:text-4xl">{title}</h1>
      {children && <div className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">{children}</div>}
    </header>
  );
}
