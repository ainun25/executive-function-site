"use client";

import { useEffect, useState } from "react";
import {
  createKnowledgeCard,
  deleteKnowledgeCard,
  fetchKnowledgeCards,
  updateKnowledgeCard,
  type KnowledgeCardInput,
} from "@/lib/knowledgeRepository";
import type { KnowledgeCard } from "@/types";
import ConfirmBar from "./ConfirmBar";

interface FormState {
  nameKo: string;
  nameEn: string;
  concept: string;
  examplesText: string; // 한 줄에 하나씩
  learningRelation: string;
  difficultySignsText: string; // 한 줄에 하나씩
  sortOrder: number;
}

const EMPTY_FORM: FormState = {
  nameKo: "",
  nameEn: "",
  concept: "",
  examplesText: "",
  learningRelation: "",
  difficultySignsText: "",
  sortOrder: 0,
};

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * "실행기능 알아보기" 페이지의 설명 카드를 추가/수정/삭제하는 관리자 화면입니다.
 * 카드는 "표시 순서" 숫자가 작은 것부터 위에 보입니다.
 */
export default function KnowledgeManager() {
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<KnowledgeCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCards = async () => {
    setIsLoading(true);
    const data = await fetchKnowledgeCards();
    setCards(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCards();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: cards.length + 1 });
    setErrorMessage(null);
  };

  const startEdit = (card: KnowledgeCard) => {
    setNotice(null);
    setEditingId(card.id);
    setForm({
      nameKo: card.nameKo,
      nameEn: card.nameEn ?? "",
      concept: card.concept,
      examplesText: card.examples.join("\n"),
      learningRelation: card.learningRelation ?? "",
      difficultySignsText: card.difficultySigns.join("\n"),
      sortOrder: card.sortOrder,
    });
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nameKo.trim() || !form.concept.trim()) {
      setErrorMessage("영역 이름과 개념 설명은 꼭 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setNotice(null);

    const input: KnowledgeCardInput = {
      nameKo: form.nameKo.trim(),
      nameEn: form.nameEn.trim() || null,
      concept: form.concept.trim(),
      examples: splitLines(form.examplesText),
      learningRelation: form.learningRelation.trim() || null,
      difficultySigns: splitLines(form.difficultySignsText),
      sortOrder: form.sortOrder,
    };

    const result = editingId ? await updateKnowledgeCard(editingId, input) : await createKnowledgeCard(input);
    setIsSaving(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setNotice(editingId ? "수정했어요." : "새 카드를 등록했어요.");
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: cards.length + 2 });
    loadCards();
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    const result = await deleteKnowledgeCard(pendingDelete.id);
    setIsDeleting(false);
    setPendingDelete(null);
    setNotice(result.error ? `삭제 실패: ${result.error}` : "카드를 삭제했어요.");
    if (!result.error) loadCards();
  };

  return (
    <div className="space-y-8">
      <p className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
        &ldquo;실행기능 알아보기&rdquo; 페이지에 보이는 설명 카드를 관리해요. 카드는 <strong>표시 순서</strong>가
        작은 것부터 위에 나옵니다. 홈 화면의 &ldquo;3가지 핵심 영역&rdquo; 소개와 검사/훈련 분류는 이 카드와 별개로
        고정되어 있어요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800">{editingId ? "카드 수정" : "새 카드 등록"}</h3>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_6rem]">
          <input
            type="text"
            placeholder="영역 이름 (예: 계획하기)"
            value={form.nameKo}
            onChange={(e) => setForm({ ...form, nameKo: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="영문 이름 (선택, 예: Planning)"
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            aria-label="표시 순서"
            title="표시 순서 (작을수록 위)"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <textarea
          placeholder="개념 설명"
          value={form.concept}
          onChange={(e) => setForm({ ...form, concept: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder={"생활 속 예 (한 줄에 하나씩)\n예) 하고 싶은 말을 잠깐 멈추기"}
          value={form.examplesText}
          onChange={(e) => setForm({ ...form, examplesText: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="학습과의 관계 (선택)"
          value={form.learningRelation}
          onChange={(e) => setForm({ ...form, learningRelation: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder={"어려움이 나타날 수 있는 모습 (한 줄에 하나씩)\n예) 순서를 기다리지 못함"}
          value={form.difficultySignsText}
          onChange={(e) => setForm({ ...form, difficultySignsText: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

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
        <h3 className="mb-3 font-bold text-slate-800">등록된 카드 ({cards.length}개)</h3>
        {pendingDelete && (
          <div className="mb-3">
            <ConfirmBar
              message={`"${pendingDelete.nameKo}" 카드를 삭제할까요?`}
              isBusy={isDeleting}
              onConfirm={handleConfirmDelete}
              onCancel={() => setPendingDelete(null)}
            />
          </div>
        )}
        {notice && <p className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{notice}</p>}
        {isLoading ? (
          <p className="text-sm text-slate-400">불러오는 중...</p>
        ) : cards.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-400">등록된 카드가 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {cards.map((card) => (
              <li
                key={card.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm"
              >
                <div>
                  <span className="mr-2 text-xs text-slate-400">#{card.sortOrder}</span>
                  <span className="font-semibold text-slate-800">{card.nameKo}</span>
                  {card.nameEn && <span className="ml-2 text-xs text-slate-400">{card.nameEn}</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(card)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotice(null);
                      setPendingDelete(card);
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
