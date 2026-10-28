import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { efDomains } from "@/data/efDomains";
import type { KnowledgeCard } from "@/types";

// DB에 연결할 수 없을 때 "실행기능 알아보기"가 빈 화면이 되지 않도록 쓰는 예비 데이터입니다.
const FALLBACK_CARDS: KnowledgeCard[] = efDomains.map((domain, index) => ({
  id: `fallback-${domain.id}`,
  nameKo: domain.nameKo,
  nameEn: domain.nameEn,
  concept: domain.concept,
  examples: domain.examples,
  learningRelation: domain.learningRelation,
  difficultySigns: domain.difficultySigns,
  sortOrder: index + 1,
}));

interface KnowledgeCardRow {
  id: string;
  name_ko: string;
  name_en: string | null;
  concept: string;
  examples: string[] | null;
  learning_relation: string | null;
  difficulty_signs: string[] | null;
  sort_order: number;
}

function rowToCard(row: KnowledgeCardRow): KnowledgeCard {
  return {
    id: row.id,
    nameKo: row.name_ko,
    nameEn: row.name_en,
    concept: row.concept,
    examples: row.examples ?? [],
    learningRelation: row.learning_relation,
    difficultySigns: row.difficulty_signs ?? [],
    sortOrder: row.sort_order,
  };
}

export async function fetchKnowledgeCards(): Promise<KnowledgeCard[]> {
  if (!isSupabaseConfigured || !supabase) return FALLBACK_CARDS;

  const { data, error } = await supabase
    .from("ef_knowledge_cards")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.warn("설명 카드를 불러오지 못했습니다:", error?.message);
    return FALLBACK_CARDS;
  }

  // 관리자가 카드를 모두 지운 경우에는 빈 목록 그대로 보여줍니다(관리자의 의도).
  return (data as KnowledgeCardRow[]).map(rowToCard);
}

export interface KnowledgeCardInput {
  nameKo: string;
  nameEn: string | null;
  concept: string;
  examples: string[];
  learningRelation: string | null;
  difficultySigns: string[];
  sortOrder: number;
}

function toRow(input: KnowledgeCardInput) {
  return {
    name_ko: input.nameKo,
    name_en: input.nameEn,
    concept: input.concept,
    examples: input.examples,
    learning_relation: input.learningRelation,
    difficulty_signs: input.difficultySigns,
    sort_order: input.sortOrder,
  };
}

export async function createKnowledgeCard(input: KnowledgeCardInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase가 설정되어 있지 않습니다." };
  const { error } = await supabase.from("ef_knowledge_cards").insert(toRow(input));
  return { error: error?.message ?? null };
}

export async function updateKnowledgeCard(
  id: string,
  input: KnowledgeCardInput
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase가 설정되어 있지 않습니다." };
  const { data, error } = await supabase
    .from("ef_knowledge_cards")
    .update(toRow(input))
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "수정되지 않았어요. 로그인 상태와 권한을 확인해주세요." };
  return { error: null };
}

export async function deleteKnowledgeCard(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase가 설정되어 있지 않습니다." };
  const { data, error } = await supabase.from("ef_knowledge_cards").delete().eq("id", id).select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "삭제되지 않았어요. 로그인 상태와 권한을 확인해주세요." };
  return { error: null };
}
