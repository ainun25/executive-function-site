import Link from "next/link";
import { efDomains, testInfos, testRoutes } from "@/data/efDomains";

const colorClasses: Record<string, string> = {
  rose: "bg-rose-50 text-rose-600 ring-rose-200",
  sky: "bg-sky-50 text-sky-600 ring-sky-200",
  amber: "bg-amber-50 text-amber-600 ring-amber-200",
};

export default function Home() {
  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-b from-teal-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="text-sm font-semibold text-teal-600">초등학생을 위한 실행기능 통합 플랫폼</p>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-5xl">
            생각을 조절하는 힘, <br className="sm:hidden" />
            <span className="text-teal-600">실행기능</span>을 함께 알아봐요
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
            실행기능이 무엇인지 이해하고, 간단한 수행과제로 살펴보고, 재미있는 활동으로 훈련해 보세요.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/about"
              className="w-full rounded-full bg-teal-500 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-600 sm:w-auto"
            >
              실행기능 알아보기
            </Link>
            <Link
              href="/tests"
              className="w-full rounded-full border border-teal-500 px-6 py-3 text-center text-base font-semibold text-teal-600 transition-colors hover:bg-teal-50 sm:w-auto"
            >
              실행기능 검사 하러 가기
            </Link>
          </div>
        </div>
      </section>

      {/* 3대 실행기능 소개 요약 */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          실행기능의 3가지 핵심 영역
        </h2>
        <p className="mt-2 text-center text-slate-500">
          이 사이트는 다음 세 가지 핵심 실행기능을 중심으로 구성되어 있어요.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {efDomains.map((domain) => (
            <div
              key={domain.id}
              className={`rounded-2xl p-6 ring-1 ${colorClasses[domain.color]}`}
            >
              <h3 className="text-lg font-bold">{domain.nameKo}</h3>
              <p className="text-xs opacity-70">{domain.nameEn}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{domain.concept}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4가지 핵심 기능 소개 */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            무엇을 할 수 있나요?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard title="① 실행기능 이해" desc="개념과 생활 속 예시를 쉽게 알아봐요." href="/about" />
            <FeatureCard title="② 자료 찾아보기" desc="키워드로 관련 자료를 검색해요." href="/tests" comingSoon />
            <FeatureCard title="③ 실행기능 검사" desc="간단한 수행과제로 살펴봐요." href="/tests" />
            <FeatureCard title="④ 실행기능 훈련" desc="재미있는 활동으로 연습해요." href="/training" />
          </div>
        </div>
      </section>

      {/* 검사 카드 미리보기 */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">실행기능 검사</h2>
          <Link href="/tests" className="text-sm font-semibold text-teal-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {testInfos.map((test) => (
            <Link
              key={test.id}
              href={testRoutes[test.id]}
              className={`block rounded-2xl border p-6 ring-1 transition-shadow hover:shadow-md ${colorClasses[test.color]}`}
            >
              <h3 className="text-lg font-bold text-slate-900">{test.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{test.shortDescription}</p>
              <p className="mt-4 text-xs text-slate-400">예상 소요시간 약 {test.estimatedMinutes}분</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  href,
  comingSoon,
}: {
  title: string;
  desc: string;
  href: string;
  comingSoon?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md"
    >
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{desc}</p>
      {comingSoon && (
        <span className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-400">
          준비 중
        </span>
      )}
    </Link>
  );
}
