import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { ContentCategory, ContentItem } from "@/types";

// Supabase가 설정되지 않았을 때(로컬 개발 초기 등)도 검색 화면이 비어 보이지 않도록
// 사용하는 최소한의 예비 데이터입니다. 실제 자료는 Supabase의 content_items 테이블에서 옵니다.
const FALLBACK_CONTENT: ContentItem[] = [
  {
    id: "fallback-1",
    title: "실행기능이란 무엇인가",
    summary: "목표를 정하고 생각과 행동을 조절하는 인지적 조절 능력에 대한 기본 개념 설명.",
    category: "concept",
    keywords: ["실행기능", "개념"],
    source: "사이트 내부 자료",
    author: null,
    year: null,
    url: null,
    createdAt: new Date().toISOString(),
  },
];

interface ContentItemRow {
  id: string;
  title: string;
  summary: string;
  category: ContentCategory;
  keywords: string[] | null;
  source: string | null;
  author: string | null;
  year: number | null;
  url: string | null;
  created_at: string;
}

function rowToContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    keywords: row.keywords ?? [],
    source: row.source,
    author: row.author,
    year: row.year,
    url: row.url,
    createdAt: row.created_at,
  };
}

export async function fetchContentItems(): Promise<ContentItem[]> {
  if (!isSupabaseConfigured || !supabase) return FALLBACK_CONTENT;

  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("검색 자료를 불러오지 못했습니다:", error?.message);
    return FALLBACK_CONTENT;
  }

  return (data as ContentItemRow[]).map(rowToContentItem);
}

export interface ContentItemInput {
  title: string;
  summary: string;
  category: ContentCategory;
  keywords: string[];
  source: string | null;
  author: string | null;
  year: number | null;
  url: string | null;
}

export async function createContentItem(input: ContentItemInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase가 설정되어 있지 않습니다." };
  const { error } = await supabase.from("content_items").insert({
    title: input.title,
    summary: input.summary,
    category: input.category,
    keywords: input.keywords,
    source: input.source,
    author: input.author,
    year: input.year,
    url: input.url,
  });
  return { error: error?.message ?? null };
}

export async function updateContentItem(
  id: string,
  input: ContentItemInput
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase가 설정되어 있지 않습니다." };
  const { error } = await supabase
    .from("content_items")
    .update({
      title: input.title,
      summary: input.summary,
      category: input.category,
      keywords: input.keywords,
      source: input.source,
      author: input.author,
      year: input.year,
      url: input.url,
    })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteContentItem(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase가 설정되어 있지 않습니다." };
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  return { error: error?.message ?? null };
}
