import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { defaultInhibitionConfig, practiceInhibitionConfig } from "./inhibitionEngine";
import { defaultWorkingMemoryConfig, practiceWorkingMemoryConfig } from "./workingMemoryEngine";
import { defaultFlexibilityConfig, practiceFlexibilityConfig } from "./flexibilityEngine";
import type { EFDomain } from "@/types";

// 관리자가 바꿀 수 있는 검사 설정의 정의입니다.
// 각 항목마다 "허용 범위(min~max)"를 두어, 검사가 망가질 값(예: 문항 수 0)은 저장되지 않게 막습니다.
export type TestConfigValues = Record<string, number>;

export interface ConfigField {
  key: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  help?: string;
}

export const TEST_CONFIG_FIELDS: Record<EFDomain, ConfigField[]> = {
  inhibition: [
    { key: "totalTrials", label: "본검사 문항 수", unit: "개", min: 10, max: 100, help: "기본 40개" },
    { key: "goRatio", label: "GO(고양이) 비율", min: 0.5, max: 0.9, step: 0.05, help: "0.7 = 70%가 고양이" },
    { key: "fixationMs", label: "자극 전 + 표시 시간", unit: "ms", min: 200, max: 2000 },
    { key: "stimulusDurationMs", label: "자극 표시 시간(반응 제한)", unit: "ms", min: 500, max: 3000 },
    { key: "interTrialGapMs", label: "문항 사이 대기 시간", unit: "ms", min: 100, max: 2000 },
    { key: "anticipatoryThresholdMs", label: "너무 빠른 반응 기준", unit: "ms", min: 50, max: 400, help: "이보다 빠르면 anticipatory로 표시" },
  ],
  workingMemory: [
    { key: "startSpan", label: "시작 칸 수", unit: "개", min: 1, max: 5 },
    { key: "maxSpan", label: "최대 칸 수", unit: "개", min: 2, max: 9, help: "시작 칸 수보다 크거나 같아야 해요" },
    { key: "itemDisplayMs", label: "칸 하나가 반짝이는 시간", unit: "ms", min: 300, max: 2000 },
    { key: "itemGapMs", label: "칸 사이 꺼져 있는 시간", unit: "ms", min: 100, max: 1500 },
    { key: "maxAttemptsPerSpan", label: "같은 길이 최대 시도 횟수", unit: "회", min: 1, max: 3, help: "모두 틀리면 검사 종료" },
  ],
  flexibility: [
    { key: "colorBlockTrials", label: "색깔 규칙 문항 수", unit: "개", min: 2, max: 20 },
    { key: "shapeBlockTrials", label: "모양 규칙 문항 수", unit: "개", min: 2, max: 20 },
    { key: "mixedBlockTrials", label: "혼합 규칙 문항 수", unit: "개", min: 8, max: 60 },
    { key: "stimulusDurationMs", label: "응답 제한 시간", unit: "ms", min: 1000, max: 6000 },
    { key: "interTrialGapMs", label: "문항 사이 대기 시간", unit: "ms", min: 100, max: 2000 },
  ],
};

export const TEST_CONFIG_DEFAULTS: Record<EFDomain, TestConfigValues> = {
  inhibition: { ...defaultInhibitionConfig },
  workingMemory: { ...defaultWorkingMemoryConfig },
  flexibility: { ...defaultFlexibilityConfig },
};

// 연습 문제는 본검사와 같은 속도/규칙을 쓰되, 문항 수만 줄여서 만듭니다.
export function toPracticeConfig<T extends object>(domain: EFDomain, config: T): T {
  if (domain === "inhibition") {
    return { ...config, totalTrials: practiceInhibitionConfig.totalTrials };
  }
  if (domain === "workingMemory") {
    return { ...config, maxSpan: Math.min((config as { maxSpan: number }).maxSpan, practiceWorkingMemoryConfig.maxSpan) };
  }
  return {
    ...config,
    colorBlockTrials: practiceFlexibilityConfig.colorBlockTrials,
    shapeBlockTrials: practiceFlexibilityConfig.shapeBlockTrials,
    mixedBlockTrials: practiceFlexibilityConfig.mixedBlockTrials,
  };
}

// 입력값이 허용 범위 안에 있는지 검사하고, 문제가 있으면 사람이 읽을 수 있는 문장 목록을 돌려줍니다.
export function validateConfig(domain: EFDomain, values: TestConfigValues): string[] {
  const errors: string[] = [];
  for (const field of TEST_CONFIG_FIELDS[domain]) {
    const value = values[field.key];
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push(`"${field.label}"에 숫자를 입력해주세요.`);
    } else if (value < field.min || value > field.max) {
      errors.push(`"${field.label}"은(는) ${field.min}~${field.max} 사이여야 해요.`);
    }
  }
  if (domain === "workingMemory" && values.maxSpan < values.startSpan) {
    errors.push("최대 칸 수는 시작 칸 수보다 크거나 같아야 해요.");
  }
  return errors;
}

// DB에서 읽은 값을 믿지 않고 기본값 위에 얹은 뒤 허용 범위로 맞춰, 검사가 항상 안전하게 시작되게 합니다.
function sanitizeConfig(domain: EFDomain, raw: unknown): TestConfigValues {
  const merged: TestConfigValues = { ...TEST_CONFIG_DEFAULTS[domain] };
  if (raw && typeof raw === "object") {
    for (const field of TEST_CONFIG_FIELDS[domain]) {
      const value = (raw as Record<string, unknown>)[field.key];
      if (typeof value === "number" && Number.isFinite(value)) {
        merged[field.key] = Math.min(field.max, Math.max(field.min, value));
      }
    }
  }
  if (domain === "workingMemory" && merged.maxSpan < merged.startSpan) {
    merged.maxSpan = merged.startSpan;
  }
  return merged;
}

// 현재 적용 중인 설정을 가져옵니다. DB에 설정이 없거나 연결이 안 되면 기본값을 씁니다.
export async function fetchTestConfig(domain: EFDomain): Promise<TestConfigValues> {
  if (!isSupabaseConfigured || !supabase) return { ...TEST_CONFIG_DEFAULTS[domain] };

  const { data, error } = await supabase.from("test_settings").select("config").eq("id", domain).maybeSingle();
  if (error) {
    console.warn("검사 설정을 불러오지 못해 기본값을 사용합니다:", error.message);
    return { ...TEST_CONFIG_DEFAULTS[domain] };
  }
  return sanitizeConfig(domain, data?.config);
}

export async function saveTestConfig(
  domain: EFDomain,
  values: TestConfigValues
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase가 설정되어 있지 않습니다." };

  const errors = validateConfig(domain, values);
  if (errors.length > 0) return { error: errors.join(" ") };

  const { data, error } = await supabase
    .from("test_settings")
    .upsert({ id: domain, config: values, updated_at: new Date().toISOString() })
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "저장되지 않았어요. 로그인 상태와 권한을 확인해주세요." };
  return { error: null };
}
