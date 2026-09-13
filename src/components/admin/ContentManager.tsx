"use client";

import { useEffect, useState } from "react";
import {
  createContentItem,
  deleteContentItem,
  fetchContentItems,
  updateContentItem,
  type ContentItemInput,
} from "@/lib/contentRepository";
import type { ContentCategory, ContentItem } from "@/types";

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  concept: "기본 개념",
  research: "연구",
  education: "교육자료",
  training: "훈련활동",
  webResource: "관련 웹자료",
};

const EMPTY_FORM: ContentItemInput = {
  title: "",
  summary: "",
  category: "concept",
  keywords: [],
  source: null,
  author: null,
  year: null,
  url: null,
};

export default function ContentManager() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContentItemInput>(EMPTY_FORM);
  const [keywordsText, setKeywordsText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    const data = await fetchContentItems();
    setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setKeywordsText("");
    setErrorMessage(null);
  };

  const startEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      summary: item.summary,
      category: item.category,
      keywords: item.keywords,
      source: item.source,
      author: item.author,
      year: item.year,
      url: item.url,
    });
    setKeywordsText(item.keywords.join(", "));
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) {
      setErrorMessage("제목과 요약은 꼭 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const input: ContentItemInput = {
      ...form,
      keywords: keywordsText
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };

    const result = editingId
      ? await updateContentItem(editingId, input)
      : await createContentItem(input);

    setIsSaving(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    resetForm();
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("이 자료를 삭제할까요?")) return;
    const result = await deleteContentItem(id);
    if (result.error) {
      window.alert(`삭제 실패: ${result.error}`);
      return;
    }
    loadItems();
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800">
          {editingId ? "자료 수정" : "새 자료 등록"}
        </h3>

        <input
          type="text"
          placeholder="제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="요약 설명"
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ContentCategory })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {(Object.keys(CATEGORY_LABELS) as ContentCategory[]).map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="키워드 (쉼표로 구분, 예: 억제통제, 주의집중)"
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="출처"
            value={form.source ?? ""}
            onChange={(e) => setForm({ ...form, source: e.target.value || null })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="저자 (선택)"
            value={form.author ?? ""}
            onChange={(e) => setForm({ ...form, author: e.target.value || null })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="연도 (선택)"
            value={form.year ?? ""}
            onChange={(e) => setForm({ ...form, year: e.target.value ? Number(e.target.value) : null })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="url"
            placeholder="URL (선택)"
            value={form.url ?? ""}
            onChange={(e) => setForm({ ...form, url: e.target.value || null })}
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
        <h3 className="mb-3 font-bold text-slate-800">등록된 자료 ({items.length}개)</h3>
        {isLoading ? (
          <p className="text-sm text-slate-400">불러오는 중...</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-800">{item.title}</span>
                  <span className="ml-2 text-xs text-slate-400">{CATEGORY_LABELS[item.category]}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
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
