"use client";

import { useEffect, useState } from "react";
import { fetchKnowledgeCards } from "@/lib/knowledgeRepository";
import type { KnowledgeCard } from "@/types";

// "실행기능 알아보기" 페이지의 설명 카드 목록. 카드는 관리자 화면에서 관리합니다.
export default function KnowledgeCardList() {
  const [cards, setCards] = useState<KnowledgeCard[] | null>(null);

  useEffect(() => {
    fetchKnowledgeCards().then(setCards);
  }, []);

  if (!cards) {
    return <p className="mt-12 text-center text-slate-400">불러오는 중...</p>;
  }

  if (cards.length === 0) {
    return <p className="mt-12 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-400">준비 중이에요.</p>;
  }

  return (
    <div className="mt-12 space-y-8">
      {cards.map((card) => (
        <section key={card.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-2xl font-bold text-slate-900">{card.nameKo}</h2>
            {card.nameEn && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {card.nameEn}
              </span>
            )}
          </div>

          <p className="mt-4 leading-relaxed text-slate-700">{card.concept}</p>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {card.examples.length > 0 && (
              <InfoBlock title="생활 속 예">
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  {card.examples.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </InfoBlock>
            )}

            {card.learningRelation && (
              <InfoBlock title="학습과의 관계">
                <p className="text-sm text-slate-600">{card.learningRelation}</p>
              </InfoBlock>
            )}

            {card.difficultySigns.length > 0 && (
              <InfoBlock title="어려움이 나타날 수 있는 모습">
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  {card.difficultySigns.map((sign) => (
                    <li key={sign}>{sign}</li>
                  ))}
                </ul>
              </InfoBlock>
            )}
          </div>
        </section>
      ))}
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
