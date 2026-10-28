"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchTrainingMaterials } from "@/lib/trainingRepository";
import { TrainingCategory, TrainingMaterial } from "@/types";
import { DOMAIN_NAMES, GAMES, GAME_LEVELS, loadStars } from "@/lib/trainingGames";

const categoryLabels: Record<TrainingCategory, string> = {
  inhibition: "억제통제",
  workingMemory: "작업기억",
  flexibility: "인지적 유연성",
  combined: "종합 활동",
};

const categoryColors: Record<TrainingCategory, string> = {
  inhibition: "bg-indigo-100 text-indigo-700",
  workingMemory: "bg-indigo-100 text-indigo-700",
  flexibility: "bg-indigo-100 text-indigo-700",
  combined: "bg-indigo-100 text-indigo-700",
};

export default function TrainingPage() {
  const [materials, setMaterials] = useState<TrainingMaterial[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainingMaterials().then(setMaterials);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">실행기능 놀이</h1>
        <p className="mt-4 text-base text-slate-600">
          실행기능을 재미있게 연습할 수 있는 활동 자료예요.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-800">🎮 게임으로 놀기</h2>
        <Link
          href="/training/earth-guard"
          className="mt-3 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#1a1f3c] to-[#2b2f6e] p-5 text-white shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="text-4xl" aria-hidden="true">
            🛸
          </span>
          <span className="flex-1">
            <span className="block text-lg font-bold">지구 수호대 작전</span>
            <span className="mt-1 block text-sm text-slate-200">
              아군은 터치! 적군은 참기! 3단계 우주 미션 (약 3분)
            </span>
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">억제통제</span>
        </Link>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-500">단계별 게임 (1단계 예비초등 · 2단계 저학년 · 3단계 고학년)</h3>
        {(["inhibition", "workingMemory", "flexibility"] as const).map((domain) => (
          <div key={domain} className="mt-4">
            <h4 className="text-sm font-bold text-slate-700">{DOMAIN_NAMES[domain]}</h4>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {GAMES.filter((game) => game.domain === domain).map((game) => {
                const stars = loadStars(game.id);
                return (
                      <Link
                        key={game.id}
                        href={game.route}
                        className="flex flex-col rounded-2xl bg-gradient-to-b from-[#1a1f3c] to-[#2b2f6e] p-4 text-white shadow-sm transition-shadow hover:shadow-md"
                      >
                        <span className="flex items-center justify-between">
                          <span className="text-3xl" aria-hidden="true">
                            {game.icon}
                          </span>
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                            {DOMAIN_NAMES[game.domain]}
                          </span>
                        </span>
                        <span className="mt-2 text-base font-bold">{game.title}</span>
                        <span className="mt-1 flex-1 text-xs text-slate-200">{game.tagline}</span>
                        <span className="mt-3 flex gap-3 text-xs text-slate-300">
                          {GAME_LEVELS.map((lv) => (
                            <span key={lv}>
                              {lv}단계 {"⭐".repeat(stars[lv] ?? 0) || "·"}
                            </span>
                          ))}
                        </span>
                      </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <h2 className="mt-10 text-lg font-bold text-slate-800">📋 활동 자료</h2>

      {!materials ? (
        <p className="mt-10 text-center text-slate-400">불러오는 중...</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => {
            const isExpanded = expandedId === material.id;
            return (
              <div
                key={material.id}
                className="flex flex-col rounded-2xl border border-slate-200 p-6 shadow-sm"
              >
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[material.category]}`}
                >
                  {categoryLabels[material.category]}
                </span>
                <h2 className="mt-3 text-lg font-bold text-slate-900">{material.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {material.description}
                </p>
                <dl className="mt-4 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <dt>대상 학년</dt>
                    <dd>{material.targetGrade}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>난이도</dt>
                    <dd>{material.difficulty}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>소요시간</dt>
                    <dd>약 {material.durationMinutes}분</dd>
                  </div>
                </dl>

                {material.fileUrl && /^https?:\/\//i.test(material.fileUrl) && (
                  <a
                    href={material.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    📎 자료 열기
                  </a>
                )}

                {(material.materials || material.activitySteps || material.learningGoal) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : material.id)}
                      className="mt-4 text-left text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      {isExpanded ? "간단히 보기 ▲" : "자세히 보기 ▼"}
                    </button>
                    {isExpanded && (
                      <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        {material.materials && (
                          <p>
                            <strong className="text-slate-700">준비물:</strong> {material.materials}
                          </p>
                        )}
                        {material.activitySteps && (
                          <p>
                            <strong className="text-slate-700">활동방법:</strong> {material.activitySteps}
                          </p>
                        )}
                        {material.learningGoal && (
                          <p>
                            <strong className="text-slate-700">교육 목표:</strong> {material.learningGoal}
                          </p>
                        )}
                        {material.source && (
                          <p>
                            <strong className="text-slate-700">출처:</strong> {material.source}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
