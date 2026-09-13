"use client";

import { useState } from "react";
import { getParticipantProfile, saveParticipantProfile } from "@/lib/participantProfile";
import type { ParticipantInfo } from "@/types";

interface ParticipantInfoFormProps {
  onSubmit: (info: ParticipantInfo) => void;
}

/**
 * 검사를 시작하기 전에 이름과 나이를 입력받는 화면입니다.
 * - 이름은 이 브라우저에 저장되어 다음 검사부터 자동으로 채워집니다.
 * - 나이는 시간이 지나면 달라지므로 검사할 때마다 다시 선택합니다.
 * - 이름/나이는 실제 개인정보이므로, 보호자 동의 없이는 진행할 수 없습니다.
 */
export default function ParticipantInfoForm({ onSubmit }: ParticipantInfoFormProps) {
  const existingProfile = getParticipantProfile();
  const [name, setName] = useState(existingProfile?.name ?? "");
  const [ageYears, setAgeYears] = useState<number | "">("");
  const [ageMonths, setAgeMonths] = useState<number | "">("");
  const [hasConsented, setHasConsented] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setErrorMessage("이름을 입력해주세요.");
      return;
    }
    if (ageYears === "" || ageMonths === "") {
      setErrorMessage("나이를 선택해주세요.");
      return;
    }
    if (!hasConsented) {
      setErrorMessage("보호자 동의 항목에 체크해주세요.");
      return;
    }

    saveParticipantProfile({ name: name.trim(), consentedAt: new Date().toISOString() });
    onSubmit({ name: name.trim(), ageYears: Number(ageYears), ageMonths: Number(ageMonths) });
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-center text-xl font-bold text-slate-900">검사 시작 전에 알려주세요</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        이 정보는 검사 결과를 분석하는 목적으로만 사용되며, 관리자만 확인할 수 있어요.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">이름</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="이름을 입력하세요"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">나이 (만 나이)</label>
          <div className="flex gap-2">
            <select
              value={ageYears}
              onChange={(event) => setAgeYears(event.target.value === "" ? "" : Number(event.target.value))}
              className="w-1/2 rounded-lg border border-slate-300 px-3 py-3 text-sm"
            >
              <option value="">년</option>
              {Array.from({ length: 15 }, (_, i) => i).map((year) => (
                <option key={year} value={year}>
                  {year}세
                </option>
              ))}
            </select>
            <select
              value={ageMonths}
              onChange={(event) => setAgeMonths(event.target.value === "" ? "" : Number(event.target.value))}
              className="w-1/2 rounded-lg border border-slate-300 px-3 py-3 text-sm"
            >
              <option value="">개월</option>
              {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                <option key={month} value={month}>
                  {month}개월
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <input
            type="checkbox"
            checked={hasConsented}
            onChange={(event) => setHasConsented(event.target.checked)}
            className="mt-0.5"
          />
          <span>
            보호자로서 아이의 이름과 나이 정보가 검사 결과 분석 목적으로 저장되는 것에 동의합니다.
            자세한 내용은{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
              개인정보 보호 안내
            </a>
            를 참고해주세요.
          </span>
        </label>

        {errorMessage && <p className="text-sm text-indigo-600">{errorMessage}</p>}

        <button
          type="submit"
          className="w-full rounded-full bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-600"
        >
          다음
        </button>
      </form>
    </div>
  );
}
