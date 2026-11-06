import Link from "next/link";
import { efDomains, testInfos, testRoutes } from "@/data/efDomains";

const domainCardClass = "bg-indigo-50 text-indigo-700 ring-indigo-200";

const entries = [
  { href: "/about", emoji: "🌱", title: "알아보기", desc: "개념과 생활 속 예시" },
  { href: "/search", emoji: "🔍", title: "찾아보기", desc: "관련 자료 검색" },
  { href: "/tests", emoji: "📝", title: "검사", desc: "간단한 수행과제" },
  { href: "/training", emoji: "🎮", title: "놀이", desc: "게임으로 연습" },
];

export default function Home() {
  return (
    <div>
      {/* 첫 화면: 제목과 네 가지 시작 메뉴가 한 화면에 모두 보이도록 */}
      <section className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto flex min-h-[calc(100svh-9rem)] max-w-6xl flex-col justify-center px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-semibold text-indigo-600">유초등을 위한 실행기능 통합 플랫폼</p>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-5xl">
            생각을 조절하는 힘, <br className="sm:hidden" />
            <span className="text-indigo-600">실행기능</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
            알아보고, 찾아보고, 검사하고, 놀이로 연습해요.
          </p>
          <div className="mx-auto mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {entries.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="flex flex-col items-center rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md sm:p-5"
              >
                <span className="text-3xl sm:text-4xl" aria-hidden="true">
                  {e.emoji}
                </span>
                <span className="mt-2 text-base font-bold text-slate-900">{e.title}</span>
                <span className="mt-1 text-xs leading-snug text-slate-500 sm:text-sm">{e.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3대 실행기능 소개 요약 */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          실행기능의 3가지 핵심 영역
        </h2>
        <p className="mt-2 text-center text-slate-600">
          이 사이트는 다음 세 가지 핵심 실행기능을 중심으로 구성되어 있어요.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {efDomains.map((domain) => (
            <div key={domain.id} className={`rounded-2xl p-6 ring-1 ${domainCardClass}`}>
              <h3 className="text-lg font-bold">{domain.nameKo}</h3>
              <p className="text-xs">{domain.nameEn}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{domain.concept}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 검사 카드 미리보기 */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">실행기능 검사</h2>
          <Link href="/tests" className="text-sm font-semibold text-indigo-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {testInfos.map((test) => (
            <Link
              key={test.id}
              href={testRoutes[test.id]}
              className={`block rounded-2xl border p-6 ring-1 transition-shadow hover:shadow-md ${domainCardClass}`}
            >
              <h3 className="text-lg font-bold text-slate-900">{test.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{test.shortDescription}</p>
              <p className="mt-4 text-xs text-slate-500">예상 소요시간 약 {test.estimatedMinutes}분</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
