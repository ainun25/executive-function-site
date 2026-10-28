import type { Metadata } from "next";
import KnowledgeCardList from "@/components/about/KnowledgeCardList";

export const metadata: Metadata = {
  title: "실행기능 알아보기 | 실행기능 놀이터",
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

      <KnowledgeCardList />

      <p className="mt-12 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
        이 영역들은 실행기능을 이해하는 데 도움이 되는 핵심 구성요소이지만, 이것만으로 한 아이의 실행기능
        전체를 판단하거나 진단할 수는 없어요.
      </p>
    </div>
  );
}
