"use client";

const PARTICIPANT_ID_KEY = "ef-site:participantId";

/**
 * 실명 대신 이 브라우저에서만 사용하는 익명 식별자를 만들어 재사용합니다.
 * 개인을 식별할 수 있는 정보(이름 등)는 수집하지 않습니다 (섹션 17).
 */
export function getParticipantId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(PARTICIPANT_ID_KEY);
    if (existing) return existing;
    const newId = crypto.randomUUID();
    window.localStorage.setItem(PARTICIPANT_ID_KEY, newId);
    return newId;
  } catch {
    return "unknown";
  }
}
