"use client";

import { useEffect, useState } from "react";
import {
  createTrainingMaterial,
  deleteTrainingMaterial,
  fetchTrainingMaterials,
  updateTrainingMaterial,
  type TrainingMaterialInput,
} from "@/lib/trainingRepository";
import {
  FILE_ACCEPT_ATTRIBUTE,
  FILE_RULE_TEXT,
  isOwnFileUrl,
  removeTrainingFileByUrl,
  uploadTrainingFile,
} from "@/lib/fileUpload";
import type { TrainingCategory, TrainingMaterial } from "@/types";
import ConfirmBar from "./ConfirmBar";

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

  // 파일 업로드 관련 상태.
  // pendingUploadUrl: 방금 올렸지만 아직 "저장"하지 않은 파일 (저장 전에 취소하면 저장소에서 지웁니다)
  // originalFileUrl: 수정 중인 자료가 원래 가지고 있던 파일 (다른 파일로 바꿔 저장하면 옛 파일을 지웁니다)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string | null>(null);
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);

  const loadMaterials = async () => {
    setIsLoading(true);
    const data = await fetchTrainingMaterials();
    setMaterials(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // 저장하지 않은 채 폼을 닫는 경우(취소, 다른 자료 수정 시작)에는, 방금 올린 파일을 저장소에서 지웁니다.
  const discardPendingUpload = () => {
    if (pendingUploadUrl) void removeTrainingFileByUrl(pendingUploadUrl);
    setPendingUploadUrl(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setUploadMessage(null);
    setOriginalFileUrl(null);
  };

  const handleCancel = () => {
    discardPendingUpload();
    resetForm();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // 같은 파일을 다시 고를 수 있도록 선택값을 비웁니다
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);
    const result = await uploadTrainingFile(file);
    setIsUploading(false);

    if (result.error || !result.url) {
      setUploadMessage(result.error ?? "업로드에 실패했어요.");
      return;
    }

    // 이전에 올렸다가 저장하지 않은 파일이 있으면 정리하고, 새 파일 주소를 칸에 채웁니다.
    discardPendingUpload();
    setPendingUploadUrl(result.url);
    setForm((prev) => ({ ...prev, fileUrl: result.url }));
    setUploadMessage("업로드했어요. 아래 '등록/수정 저장'을 눌러야 자료에 반영돼요.");
  };

  const handleRemoveFile = () => {
    if (form.fileUrl && form.fileUrl === pendingUploadUrl) discardPendingUpload();
    setForm((prev) => ({ ...prev, fileUrl: null }));
    setUploadMessage("첨부를 뺐어요. 저장하면 자료에서 제거돼요.");
  };

  const startEdit = (material: TrainingMaterial) => {
    discardPendingUpload();
    setUploadMessage(null);
    setOriginalFileUrl(material.fileUrl ?? null);
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

    // 저장이 끝났으니 방금 올린 파일은 "사용 중"이 됩니다. 그리고 수정 중 파일을 바꾼 경우에만 옛 파일을 지웁니다.
    setPendingUploadUrl(null);
    if (editingId && originalFileUrl && originalFileUrl !== form.fileUrl && isOwnFileUrl(originalFileUrl)) {
      void removeTrainingFileByUrl(originalFileUrl);
    }

    resetForm();
    loadMaterials();
  };

  // 팝업(window.confirm)은 브라우저가 막을 수 있어서, 화면 안의 확인 영역(ConfirmBar)을 사용합니다.
  const [pendingDelete, setPendingDelete] = useState<TrainingMaterial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    const result = await deleteTrainingMaterial(pendingDelete.id);
    setIsDeleting(false);
    setPendingDelete(null);
    setNotice(result.error ? `삭제 실패: ${result.error}` : "놀이자료를 삭제했어요.");
    if (!result.error) {
      void removeTrainingFileByUrl(pendingDelete.fileUrl); // 자료가 지워지면 첨부 파일도 저장소에서 지웁니다
      loadMaterials();
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800">
          {editingId ? "놀이자료 수정" : "새 놀이자료 등록"}
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
        <input
          type="text"
          placeholder="출처 (선택)"
          value={form.source ?? ""}
          onChange={(e) => setForm({ ...form, source: e.target.value || null })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <div className="space-y-2 rounded-xl border border-dashed border-slate-300 p-4">
          <p className="text-sm font-semibold text-slate-700">첨부 파일 (선택)</p>
          <div className="flex flex-wrap items-center gap-3">
            <label
              className={`cursor-pointer rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 ${
                isUploading ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {isUploading ? "올리는 중..." : "파일 선택해서 올리기"}
              <input
                type="file"
                accept={FILE_ACCEPT_ATTRIBUTE}
                onChange={handleFileSelected}
                disabled={isUploading}
                className="sr-only"
              />
            </label>
            <span className="text-xs text-slate-400">{FILE_RULE_TEXT}</span>
          </div>
          {uploadMessage && <p className="text-xs text-indigo-600">{uploadMessage}</p>}
          <p className="text-xs text-slate-400">
            ⚠️ 올린 파일은 주소를 아는 사람 누구나 열 수 있어요. 아이 이름 등 개인정보가 든 파일은 올리지 마세요.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <input
              type="url"
              placeholder="또는 외부 링크 직접 입력 (https://...)"
              value={form.fileUrl ?? ""}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value || null })}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {form.fileUrl && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="rounded-full border border-slate-300 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
              >
                첨부 빼기
              </button>
            )}
          </div>
          {form.fileUrl && isOwnFileUrl(form.fileUrl) && (
            <p className="text-xs text-slate-500">
              현재 첨부: 업로드한 파일{" "}
              <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                열어보기
              </a>
            </p>
          )}
        </div>

        {errorMessage && <p className="text-sm text-indigo-600">{errorMessage}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : editingId ? "수정 저장" : "등록"}
          </button>
          {(editingId || pendingUploadUrl) && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm text-slate-500"
            >
              취소
            </button>
          )}
        </div>
      </form>

      <div>
        <h3 className="mb-3 font-bold text-slate-800">등록된 놀이자료 ({materials.length}개)</h3>
        {pendingDelete && (
          <div className="mb-3">
            <ConfirmBar
              message={`"${pendingDelete.title}" 놀이자료를 삭제할까요?`}
              isBusy={isDeleting}
              onConfirm={handleConfirmDelete}
              onCancel={() => setPendingDelete(null)}
            />
          </div>
        )}
        {notice && <p className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{notice}</p>}
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
                    onClick={() => {
                      setNotice(null);
                      setPendingDelete(material);
                    }}
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
