import type { Metadata } from "next";
import { efDomains } from "@/data/efDomains";

export const metadata: Metadata = {
  title: "실행기능 알아보기 | 실행기능 놀이터",
};

const colorClasses: Record<string, { ring: string; badge: string }> = {
  rose: { ring: "ring-rose-200", badge: "bg-rose-100 text-rose-700" },
  sky: { ring: "ring-sky-200", badge: "bg-sky-100 text-sky-700" },
  amber: { ring: "ring-amber-200", badge: "bg-amber-100 text-amber-700" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">실행기능 알아보기</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          <strong className="text-slate-800">실행기능(Executive Function)</strong>이란, 목표를 정하고
          자신의 생각과 행동을 조절하여 그 목표를 이루도록 돕는 인지적 조절 능력이에요.
        </p>
      </header>

      <div className="mt-12 space-y-8">
        {efDomains.map((domain) => {
          const colors = colorClasses[domain.color];
          return (
            <section
              key={domain.id}
              className={`rounded-2xl border border-slate-200 p-6 ring-1 sm:p-8 ${colors.ring}`}
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{domain.nameKo}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors.badge}`}>
                  {domain.nameEn}
                </span>
              </div>

              <p className="mt-4 leading-relaxed text-slate-700">{domain.concept}</p>

              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <InfoBlock title="생활 속 예">
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                    {domain.examples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </InfoBlock>

                <InfoBlock title="학습과의 관계">
                  <p className="text-sm text-slate-600">{domain.learningRelation}</p>
                </InfoBlock>

                <InfoBlock title="어려움이 나타날 수 있는 모습">
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                    {domain.difficultySigns.map((sign) => (
                      <li key={sign}>{sign}</li>
                    ))}
                  </ul>
                </InfoBlock>
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-12 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
        이 세 가지 영역은 실행기능을 대표하는 핵심 구성요소이지만, 이것만으로 한 아이의 실행기능 전체를
        판단하거나 진단할 수는 없어요.
      </p>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
