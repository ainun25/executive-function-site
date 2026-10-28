import { supabase } from "./supabaseClient";

// 훈련자료 첨부 파일을 Supabase 저장소(Storage)에 올리고 지우는 함수들입니다.
// 저장소의 허용 종류/용량(phase17_schema.sql)과 같은 기준으로 올리기 전에 먼저 검사합니다.
const BUCKET = "training-files";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export const FILE_ACCEPT_ATTRIBUTE = ".pdf,.png,.jpg,.jpeg";
export const FILE_RULE_TEXT = "PDF, PNG, JPG 파일 / 파일당 최대 10MB";

export function validateUploadFile(file: File): string | null {
  if (!ALLOWED_TYPES[file.type]) return `이 파일은 올릴 수 없어요. (${FILE_RULE_TEXT}만 가능)`;
  if (file.size > MAX_FILE_BYTES) {
    return `파일이 너무 커요. (${(file.size / 1024 / 1024).toFixed(1)}MB, 최대 10MB)`;
  }
  return null;
}

// 파일을 올리고, 누구나 열 수 있는 공개 주소를 돌려줍니다.
// 저장소에는 한글/특수문자 파일명이 문제를 일으킬 수 있어서, 무작위 이름 + 확장자로 저장합니다.
export async function uploadTrainingFile(file: File): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: "Supabase가 설정되어 있지 않습니다." };

  const validationError = validateUploadFile(file);
  if (validationError) return { url: null, error: validationError };

  const path = `${crypto.randomUUID()}.${ALLOWED_TYPES[file.type]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { url: null, error: `업로드 실패: ${error.message}` };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

// 우리 저장소에 올린 파일의 주소인지 확인합니다 (외부 링크는 건드리지 않기 위함).
function extractOwnPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
  return path || null;
}

export function isOwnFileUrl(url: string | null | undefined): boolean {
  return extractOwnPath(url) !== null;
}

// 저장소에서 파일을 지웁니다. 실패해도 화면 동작에는 영향이 없도록 오류는 로그만 남깁니다.
export async function removeTrainingFileByUrl(url: string | null | undefined): Promise<void> {
  const path = extractOwnPath(url);
  if (!supabase || !path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn("저장소 파일을 지우지 못했습니다:", error.message);
}
