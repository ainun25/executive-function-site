import type { Metadata } from "next";
import Link from "next/link";
import { testInfos, testRoutes } from "@/data/efDomains";

export const metadata: Metadata = {
  title: "실행기능 검사 | 실행기능 놀이터",
};

const cardClass = "bg-indigo-50 ring-indigo-200 text-indigo-700";
const buttonClass = "bg-indigo-500 hover:bg-indigo-600";

export default function TestsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">실행기능 검사</h1>
        <p className="mt-4 text-base text-slate-600">
          세 가지 실행기능 영역을 간단한 수행과제로 살펴볼 수 있어요.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {testInfos.map((test) => (
          <div key={test.id} className={`flex flex-col rounded-2xl p-6 ring-1 ${cardClass}`}>
            <h2 className="text-xl font-bold text-slate-900">{test.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
              {test.shortDescription}
            </p>
            <p className="mt-4 text-xs text-slate-400">예상 소요시간 약 {test.estimatedMinutes}분</p>
            <Link
              href={testRoutes[test.id]}
              className={`mt-5 block w-full rounded-full px-4 py-3 text-center text-sm font-semibold text-white ${buttonClass}`}
            >
              검사 소개 보러가기
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-center text-sm text-indigo-800">
        본 검사는 실행기능의 일부 특성을 살펴보기 위한 교육·연구용 수행과제이며, 의학적 또는
        심리학적 진단을 목적으로 하지 않습니다.
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
          ← 메인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
