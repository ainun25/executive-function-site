import type { Metadata } from "next";
import Link from "next/link";
import { testInfos, testRoutes } from "@/data/efDomains";

export const metadata: Metadata = {
  title: "실행기능 검사 | 실행기능 놀이터",
};

const cardClass = "bg-indigo-50 ring-indigo-200 text-indigo-700";
const buttonClass = "bg-indigo-500 hover:bg-indigo-600";

function ComingSoonStoryCard({ part, title, domain }: { part: string; title: string; domain: string }) {
  return (
    <div className="flex flex-col rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
      <p className="text-xs font-semibold text-slate-400">지구 수호대 작전 · {part}</p>
      <h3 className="mt-1 text-xl font-bold text-slate-500">{title}</h3>
      <p className="mt-3 flex-1 text-sm text-slate-400">{domain} 검사가 이야기로 이어질 예정이에요.</p>
      <span className="mt-5 block w-full rounded-full bg-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-400">
        준비 중
      </span>
    </div>
  );
}

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

      <section className="mt-14">
        <h2 className="text-center text-2xl font-extrabold text-slate-900">🛸 스토리형 검사</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          우주 이야기 속에서 하는 검사예요. 위의 표준형 검사와 그림과 구성이 달라서 점수를 직접 비교할 수 없어요.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col rounded-2xl bg-gradient-to-b from-[#1a1f3c] to-[#050a18] p-6 text-white">
            <p className="text-xs font-semibold text-[#a2ffcf]">지구 수호대 작전 · 1부</p>
            <h3 className="mt-1 text-xl font-bold text-[#00ff88]">요원 선별</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-200">
              아군은 터치, 적군은 참기! 행성, UFO, 변장한 요원을 가려내는 억제통제 검사예요.
            </p>
            <p className="mt-4 text-xs text-slate-400">억제통제 · 예상 소요시간 약 8분</p>
            <Link
              href="/tests/story/inhibition"
              className="mt-5 block w-full rounded-full bg-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-600"
            >
              검사 소개 보러가기
            </Link>
          </div>
          <div className="flex flex-col rounded-2xl bg-gradient-to-b from-[#1a1f3c] to-[#050a18] p-6 text-white">
            <p className="text-xs font-semibold text-[#a2ffcf]">지구 수호대 작전 · 2부</p>
            <h3 className="mt-1 text-xl font-bold text-[#00ff88]">신호 기억</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-200">
              보급품을 한꺼번에 기억해 찾고, 기지 신호의 순서를 기억해 보내는 작업기억 검사예요.
            </p>
            <p className="mt-4 text-xs text-slate-400">작업기억 · 예상 소요시간 약 7분</p>
            <Link
              href="/tests/story/working-memory"
              className="mt-5 block w-full rounded-full bg-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-600"
            >
              검사 소개 보러가기
            </Link>
          </div>
          <ComingSoonStoryCard part="3부" title="규칙 변경" domain="인지적 유연성" />
        </div>
      </section>

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
