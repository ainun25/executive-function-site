"use client";

import { useEffect, useState } from "react";
import {
  createTrainingMaterial,
  deleteTrainingMaterial,
  fetchTrainingMaterials,
  updateTrainingMaterial,
  type TrainingMaterialInput,
} from "@/lib/trainingRepository";
import type { TrainingCategory, TrainingMaterial } from "@/types";

const CATEGORY_LABELS: Record<TrainingCategory, string> = {
  inhibition: "억제통제",
  workingMemory: "작업기억",
  flexibility: "인지적 유연성",
  combined: "종합 활동",
};

const EMPTY_FORM: TrainingMaterialInput = {
  title: "",
  category: "inhibition",
  targetGrade: "",
  difficulty: "보통",
  durationMinutes: 10,
  description: "",
  materials: null,
  activitySteps: null,
  learningGoal: null,
  fileUrl: null,
  source: null,
};

export default function TrainingManager() {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TrainingMaterialInput>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadMaterials = async () => {
    setIsLoading(true);
    const data = await fetchTrainingMaterials();
    setMaterials(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrorMessage(null);
  };

  const startEdit = (material: TrainingMaterial) => {
    setEditingId(material.id);
    setForm({
      title: material.title,
      category: material.category,
      targetGrade: material.targetGrade,
      difficulty: material.difficulty,
      durationMinutes: material.durationMinutes,
      description: material.description,
      materials: material.materials ?? null,
      activitySteps: material.activitySteps ?? null,
      learningGoal: material.learningGoal ?? null,
      fileUrl: material.fileUrl ?? null,
      source: material.source ?? null,
    });
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setErrorMessage("제목과 설명은 꼭 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const result = editingId
      ? await updateTrainingMaterial(editingId, form)
      : await createTrainingMaterial(form);

    setIsSaving(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    resetForm();
    loadMaterials();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("이 훈련자료를 삭제할까요?")) return;
    const result = await deleteTrainingMaterial(id);
    if (result.error) {
      window.alert(`삭제 실패: ${result.error}`);
      return;
    }
    loadMaterials();
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800">
          {editingId ? "훈련자료 수정" : "새 훈련자료 등록"}
        </h3>

        <input
          type="text"
          placeholder="제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="설명"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as TrainingCategory })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {(Object.keys(CATEGORY_LABELS) as TrainingCategory[]).map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          <select
            value={form.difficulty}
            onChange={(e) =>
              setForm({ ...form, difficulty: e.target.value as TrainingMaterialInput["difficulty"] })
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="쉬움">쉬움</option>
            <option value="보통">보통</option>
            <option value="어려움">어려움</option>
          </select>
          <input
            type="number"
            placeholder="소요시간(분)"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) || 0 })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <input
          type="text"
          placeholder="대상 학년 (예: 초등 3~4학년)"
          value={form.targetGrade}
          onChange={(e) => setForm({ ...form, targetGrade: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="준비물 (선택)"
          value={form.materials ?? ""}
          onChange={(e) => setForm({ ...form, materials: e.target.value || null })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="활동방법 (선택)"
          value={form.activitySteps ?? ""}
          onChange={(e) => setForm({ ...form, activitySteps: e.target.value || null })}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="교육 목표 (선택)"
          value={form.learningGoal ?? ""}
          onChange={(e) => setForm({ ...form, learningGoal: e.target.value || null })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="url"
            placeholder="파일/외부 링크 (선택)"
            value={form.fileUrl ?? ""}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value || null })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="출처 (선택)"
            value={form.source ?? ""}
            onChange={(e) => setForm({ ...form, source: e.target.value || null })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {errorMessage && <p className="text-sm text-indigo-600">{errorMessage}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : editingId ? "수정 저장" : "등록"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm text-slate-500"
            >
              취소
            </button>
          )}
        </div>
      </form>

      <div>
        <h3 className="mb-3 font-bold text-slate-800">등록된 훈련자료 ({materials.length}개)</h3>
        {isLoading ? (
          <p className="text-sm text-slate-400">불러오는 중...</p>
        ) : (
          <ul className="space-y-2">
            {materials.map((material) => (
              <li
                key={material.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-800">{material.title}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {CATEGORY_LABELS[material.category]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(material)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(material.id)}
                    className="text-xs font-semibold text-indigo-500 hover:underline"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
