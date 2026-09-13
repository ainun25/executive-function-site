import { DeviceType } from "@/types";

/**
 * 반응시간 데이터의 품질을 검토하기 위한 최소한의 기기 정보만 수집합니다.
 * 개인을 식별하기 위한 fingerprinting(고유 식별) 목적으로는 사용하지 않습니다.
 */
export function getDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function getBrowserUserAgent(): string {
  if (typeof navigator === "undefined") return "unknown";
  return navigator.userAgent;
}

export function getScreenSize(): { width: number; height: number } {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
}

// 브라우저 탭이 비활성화(다른 탭/창으로 전환)되었는지 확인할 때 사용합니다.
// 검사 중 탭이 백그라운드로 가면 해당 trial을 invalid 처리하는 데 활용됩니다 (섹션 23).
export function isPageHidden(): boolean {
  if (typeof document === "undefined") return false;
  return document.hidden;
}
