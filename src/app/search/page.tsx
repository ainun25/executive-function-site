"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchContentItems } from "@/lib/contentRepository";
import type { ContentCategory, ContentItem } from "@/types";

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  concept: "기본 개념",
  research: "연구",
  education: "교육자료",
  training: "훈련활동",
  webResource: "관련 웹자료",
};

const CATEGORY_COLORS: Record<ContentCategory, string> = {
  concept: "bg-indigo-100 text-indigo-700",
  research: "bg-indigo-100 text-indigo-700",
  education: "bg-indigo-100 text-indigo-700",
  training: "bg-indigo-100 text-indigo-700",
  webResource: "bg-slate-200 text-slate-700",
};

const SUGGESTED_KEYWORDS = [
  "억제통제",
  "작업기억",
  "인지적 유연성",
  "주의집중",
  "계획",
  "시간관리",
  "과제 시작",
  "메타인지",
  "감정조절",
  "학습",
];

export default function SearchPage() {
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ContentCategory | "all">("all");

  useEffect(() => {
    fetchContentItems().then(setItems);
  }, []);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const haystack = [item.title, item.summary, ...item.keywords].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [items, query, activeCategory]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">실행기능 찾아보기</h1>
        <p className="mt-4 text-base text-slate-600">
          실행기능과 관련된 개념, 연구, 교육자료를 검색해볼 수 있어요.
        </p>
      </header>

      <div className="mt-8">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 억제통제, 작업기억, 주의집중..."
          className="w-full rounded-full border border-slate-300 px-5 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SUGGESTED_KEYWORDS.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => setQuery(keyword)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 hover:bg-slate-200"
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <CategoryTab
          label="전체"
          isActive={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {(Object.keys(CATEGORY_LABELS) as ContentCategory[]).map((category) => (
          <CategoryTab
            key={category}
            label={CATEGORY_LABELS[category]}
            isActive={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          />
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {!items ? (
          <p className="text-center text-slate-400">불러오는 중...</p>
        ) : filteredItems.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-400">
            검색 결과가 없어요. 다른 키워드로 찾아보세요.
          </p>
        ) : (
          filteredItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[item.category]}`}
                >
                  {CATEGORY_LABELS[item.category]}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.summary}</p>

              {item.keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.keywords.map((keyword) => (
                    <span key={keyword} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      #{keyword}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                {item.author && <span>저자: {item.author}</span>}
                {item.year && <span>{item.year}년</span>}
                {item.source && <span>출처: {item.source}</span>}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    원문 보기 →
                  </a>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <p className="mt-10 rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">
        지금은 사이트 내부에 등록된 자료만 검색돼요. 앞으로 Google Scholar, PubMed 같은 외부
        학술 검색과 연결할 수 있도록 구조가 설계되어 있습니다.
      </p>
    </div>
  );
}

function CategoryTab({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        isActive ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
