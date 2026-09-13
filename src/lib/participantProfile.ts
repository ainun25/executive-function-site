"use client";

// 이름은 같은 기기(브라우저)에서 재사용할 수 있도록 저장해둡니다.
// 나이는 검사할 때마다 달라질 수 있으므로 여기에는 저장하지 않고,
// 검사를 시작할 때마다 매번 다시 선택하도록 합니다 (ParticipantInfoForm 참고).
export interface ParticipantProfile {
  name: string;
  consentedAt: string; // 보호자 동의를 받은 시각 (ISO)
}

const STORAGE_KEY = "ef-site:participantProfile";

export function getParticipantProfile(): ParticipantProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ParticipantProfile) : null;
  } catch {
    return null;
  }
}

export function saveParticipantProfile(profile: ParticipantProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // 저장 공간이 없어도 검사 자체는 계속 진행될 수 있어야 합니다.
  }
}

export function clearParticipantProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
