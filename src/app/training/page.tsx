"use client";

import { useEffect, useState } from "react";
import { fetchTrainingMaterials } from "@/lib/trainingRepository";
import { TrainingCategory, TrainingMaterial } from "@/types";

const categoryLabels: Record<TrainingCategory, string> = {
  inhibition: "억제통제",
  workingMemory: "작업기억",
  flexibility: "인지적 유연성",
  combined: "종합 활동",
};

const categoryColors: Record<TrainingCategory, string> = {
  inhibition: "bg-rose-100 text-rose-700",
  workingMemory: "bg-sky-100 text-sky-700",
  flexibility: "bg-amber-100 text-amber-700",
  combined: "bg-violet-100 text-violet-700",
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
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">실행기능 훈련</h1>
        <p className="mt-4 text-base text-slate-600">
          실행기능을 재미있게 연습할 수 있는 활동 자료예요.
        </p>
      </header>

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

                {(material.materials || material.activitySteps || material.learningGoal) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : material.id)}
                      className="mt-4 text-left text-xs font-semibold text-teal-600 hover:underline"
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
