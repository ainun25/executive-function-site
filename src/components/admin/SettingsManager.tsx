"use client";

import { useEffect, useState } from "react";
import {
  fetchTestConfig,
  getDefaultConfig,
  saveTestConfig,
  TEST_CONFIG_FIELDS,
  validateConfig,
  type TestConfigValues,
} from "@/lib/testConfig";
import { AGE_GROUP_LABELS, AGE_GROUPS } from "@/lib/ageGroup";
import type { AgeGroup, EFDomain } from "@/types";

const DOMAIN_LABELS: Record<EFDomain, string> = {
  inhibition: "억제통제 (Go/No-Go)",
  workingMemory: "작업기억 (순서 기억)",
  flexibility: "인지적 유연성 (규칙 전환)",
};

const DOMAINS = Object.keys(DOMAIN_LABELS) as EFDomain[];

/**
 * 검사 설정(문항 수, 표시 시간 등)을 연령군별로 바꾸는 관리자 화면입니다.
 * - 연령군(예비초등/초등 저학년/초등 고학년)은 검사 전에 선택한 학년으로 정해집니다.
 * - 저장한 값은 그 뒤에 시작하는 검사부터 적용됩니다.
 * - 각 검사 결과에는 그 당시 설정값이 함께 기록됩니다(표준화 분석 시 설정이 다른 결과를 구분하기 위함).
 */
export default function SettingsManager() {
  const [activeDomain, setActiveDomain] = useState<EFDomain>("inhibition");
  const [activeAgeGroup, setActiveAgeGroup] = useState<AgeGroup>("preschool");
  const [values, setValues] = useState<TestConfigValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    setValues(null);
    setMessage(null);
    fetchTestConfig(activeDomain, activeAgeGroup).then(setValues);
  }, [activeDomain, activeAgeGroup]);

  const fields = TEST_CONFIG_FIELDS[activeDomain];

  const handleSave = async () => {
    if (!values) return;
    const errors = validateConfig(activeDomain, values);
    if (errors.length > 0) {
      setMessage({ type: "error", text: errors.join(" ") });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    const result = await saveTestConfig(activeDomain, activeAgeGroup, values);
    setIsSaving(false);
    setMessage(
      result.error
        ? { type: "error", text: `저장 실패: ${result.error}` }
        : { type: "ok", text: "저장했어요. 지금부터 시작하는 검사에 적용돼요." }
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
        <p>
          <strong>주의:</strong> 문항 수나 표시 시간을 바꾸면 이전 결과와 검사 조건이 달라져요. 표준화(연령별 평균)
          분석을 할 때는 <strong>설정이 같은 결과끼리</strong> 비교해야 정확해요. 각 결과의 &ldquo;상세&rdquo;에서
          그 검사 때 적용된 설정(testSettings)을 확인할 수 있어요.
        </p>
        <p className="mt-1">연습 문제는 본검사와 같은 속도로 하되 문항 수만 줄여서 자동으로 만들어져요.</p>
        <p className="mt-1">
          <strong>연령군별 초기값은 잠정값이에요.</strong> 표준화 자료 없이 &ldquo;어릴수록 문항 수는 적게, 속도는
          느리게&rdquo;라는 방향으로 짐작해 정한 값이며, 검증된 기준이 아니에요. 연령군마다 검사 조건이 다르면
          연령군 사이의 점수는 직접 비교할 수 없고, 같은 연령군 안에서 비교해야 해요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((domain) => (
          <button
            key={domain}
            type="button"
            onClick={() => setActiveDomain(domain)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeDomain === domain ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {DOMAIN_LABELS[domain]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {AGE_GROUPS.map((ageGroup) => (
          <button
            key={ageGroup}
            type="button"
            onClick={() => setActiveAgeGroup(ageGroup)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeAgeGroup === ageGroup
                ? "bg-indigo-500 text-white"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            {AGE_GROUP_LABELS[ageGroup]}
          </button>
        ))}
      </div>

      {!values ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-200 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="block text-sm">
                <span className="font-medium text-slate-700">{field.label}</span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={Number.isNaN(values[field.key]) ? "" : values[field.key]}
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 1}
                    onChange={(event) =>
                      setValues({ ...values, [field.key]: event.target.value === "" ? NaN : Number(event.target.value) })
                    }
                    className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  {field.unit && <span className="text-xs text-slate-400">{field.unit}</span>}
                </div>
                <span className="mt-1 block text-xs text-slate-400">
                  {field.min}~{field.max}
                  {field.help ? ` · ${field.help}` : ""}
                </span>
              </label>
            ))}
          </div>

          {message && (
            <p className={`text-sm ${message.type === "ok" ? "text-slate-700" : "text-indigo-600"}`}>{message.text}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => {
                setValues(getDefaultConfig(activeDomain, activeAgeGroup));
                setMessage({ type: "ok", text: "기본값을 채웠어요. 적용하려면 저장을 눌러주세요." });
              }}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm text-slate-500"
            >
              기본값으로 채우기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
