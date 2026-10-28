"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAllStoryResults } from "@/lib/resultStorage";
import { analyzeInhibitionTrials } from "@/lib/inhibitionAnalysis";
import { defaultInhibitionConfig } from "@/lib/inhibitionEngine";
import { summarizeByStage } from "@/lib/storyInhibition";
import { analyzeWorkingMemoryTrials } from "@/lib/workingMemoryAnalysis";
import { analyzeCapacityTrials } from "@/lib/storyCapacity";
import { analyzeFlexibilityTrials } from "@/lib/flexibilityAnalysis";
import { summarizeByBlock } from "@/lib/storyFlexibility";
import { ageGroupLabel, gradeLabel } from "@/lib/ageGroup";
import StoryInhibitionReport from "@/components/results/StoryInhibitionReport";
import StoryWorkingMemoryReport from "@/components/results/StoryWorkingMemoryReport";
import StoryFlexibilityReport from "@/components/results/StoryFlexibilityReport";
import type { EFDomain, ParticipantInfo, TestSessionSummary } from "@/types";

type StoryResults = Record<EFDomain, TestSessionSummary | null>;

const PARTS: { domain: EFDomain; part: string; title: string; icon: string; href: string }[] = [
  { domain: "inhibition", part: "1부", title: "요원 선별", icon: "🪐", href: "/tests/story/inhibition" },
  { domain: "workingMemory", part: "2부", title: "신호 기억", icon: "📡", href: "/tests/story/working-memory" },
  { domain: "flexibility", part: "3부", title: "규칙 변경", icon: "🔐", href: "/tests/story/flexibility" },
];

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 지구 수호대 작전(스토리형 검사 1~3부)의 종합 결과서입니다.
 *  - 3부를 모두 마치면 "수호대 임명장"을 보여줍니다.
 *  - 대장의 편지: 각 부에서 해낸 일을 사실 그대로 적어줍니다 (등급/비교/능력 평가 없음).
 *  - 상세 결과서: 1~3부 각각의 결과서를 한 번에 펼쳐서 인쇄할 수 있습니다.
 * 결과는 이 기기(브라우저)에 저장된 스토리형 결과를 사용합니다.
 */
export default function StoryOverallResultPage() {
  const [results, setResults] = useState<StoryResults | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    setResults(loadAllStoryResults());
  }, []);

  if (!results) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-400">불러오는 중...</div>;
  }

  const done = PARTS.filter((p) => results[p.domain]);
  const allDone = done.length === PARTS.length;

  // 가장 최근에 저장된 참여자 정보. 이름이 서로 다르면(한 기기를 여러 명이 쓴 경우) 임명장을 만들지 않습니다.
  const withParticipant = done
    .map((p) => results[p.domain]!)
    .filter((r) => r.participant)
    .sort((a, b) => b.finishedAt - a.finishedAt);
  const participant: ParticipantInfo | null = withParticipant[0]?.participant ?? null;
  const names = new Set(withParticipant.map((r) => r.participant!.name));
  const hasMixedNames = names.size > 1;
  const canIssueCertificate = allDone && !hasMixedNames && participant !== null;
  const lastFinishedAt = Math.max(...done.map((p) => results[p.domain]!.finishedAt), 0);

  if (done.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">스토리 종합 결과서</h1>
        <p className="mt-4 text-slate-500">아직 완료한 스토리형 검사가 없어요. 지구 수호대 작전을 시작해볼까요?</p>
        <Link
          href="/tests/story/inhibition"
          className="mt-6 inline-block rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-600"
        >
          1부 요원 선별 시작하기
        </Link>
      </div>
    );
  }

  const letter = buildLetter(results, participant?.name ?? "요원");

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      <header className="text-center print:hidden">
        <h1 className="text-3xl font-extrabold text-slate-900">지구 수호대 종합 결과서</h1>
        <p className="mt-2 text-sm text-slate-500">
          스토리형 검사 1~3부를 하나로 모았어요. ({done.length}/{PARTS.length}부 완료)
        </p>
        <p className="mt-1 text-xs text-slate-400">이 결과는 이 기기(브라우저)에 저장된 가장 최근 결과예요.</p>
      </header>

      {hasMixedNames && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 print:hidden">
          서로 다른 이름으로 저장된 결과가 섞여 있어요. 한 사람이 1~3부를 모두 마쳐야 임명장을 받을 수 있어요.
        </p>
      )}

      {/* 임무 완료 도장 */}
      <div className="grid gap-3 sm:grid-cols-3 print:hidden">
        {PARTS.map((p) => {
          const finished = !!results[p.domain];
          return (
            <div
              key={p.domain}
              className={`rounded-2xl p-4 text-center ${
                finished ? "bg-indigo-50 ring-1 ring-indigo-200" : "border border-dashed border-slate-300 bg-slate-50"
              }`}
            >
              <p className="text-3xl" aria-hidden="true">
                {finished ? p.icon : "🔒"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{p.part}</p>
              <p className="font-bold text-slate-900">{p.title}</p>
              {finished ? (
                <p className="mt-1 text-xs font-semibold text-indigo-600">✅ 임무 완료</p>
              ) : (
                <Link href={p.href} className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                  이 임무 하러 가기 →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* 임명장 */}
      {canIssueCertificate ? (
        <Certificate participant={participant!} date={formatDate(lastFinishedAt)} />
      ) : (
        !hasMixedNames && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 print:hidden">
            🎖️ 수호대 임명장은 1~3부를 모두 마치면 받을 수 있어요.
          </div>
        )
      )}

      {/* 대장의 편지 */}
      <section className="rounded-3xl bg-gradient-to-b from-[#1a1f3c] to-[#050a18] p-6 text-white print:bg-white print:text-black print:ring-1 print:ring-slate-300">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1f3c] text-2xl ring-2 ring-[#00ff88]"
            aria-hidden="true"
          >
            🧑‍🚀
          </span>
          <div>
            <p className="text-xs font-semibold text-[#a2ffcf] print:text-slate-500">지구 수호대 본부 대장의 편지</p>
            <h2 className="text-xl font-extrabold text-[#00ff88] print:text-slate-900">요원 {participant?.name ?? ""}에게</h2>
          </div>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-100 print:text-slate-800">
          {letter.map((line) => (
            <li key={line.part} className="rounded-xl bg-white/10 p-3 print:bg-slate-50">
              <strong className="text-[#a2ffcf] print:text-slate-900">{line.part}</strong> {line.text}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate-200 print:text-slate-700">
          {allDone
            ? "세 가지 임무를 끝까지 해냈다니, 정말 든든한 요원일세. 수고했네!"
            : "남은 임무도 준비되면 도전해 보게. 기다리고 있겠네!"}
        </p>
      </section>

      {/* 임무별 핵심 숫자 */}
      <section className="space-y-3 print:break-inside-avoid">
        <h2 className="text-lg font-bold text-slate-900">임무별로 해낸 일</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PARTS.map((p) => (
            <PartSummaryCard key={p.domain} part={p} result={results[p.domain]} />
          ))}
        </div>
      </section>

      <p className="rounded-xl bg-indigo-50 p-4 text-center text-xs leading-relaxed text-indigo-800">
        이 결과는 억제통제, 작업기억, 인지적 유연성의 일부 특성을 살펴본 수행과제 결과이며, 진단이 아니에요. 점수로
        순위를 매기거나 다른 사람과 비교하지 않아요. 스토리형 검사는 표준형 검사와 그림과 구성이 달라서 두 검사의
        점수를 직접 비교할 수 없어요.
      </p>

      <div className="flex flex-col gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-600"
        >
          🖨️ 종합 결과서 · 임명장 인쇄 / PDF로 저장
        </button>
        <button
          type="button"
          onClick={() => setShowDetail((prev) => !prev)}
          className="w-full rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          {showDetail ? "상세 결과서 접기" : "각 부 상세 결과서 펼치기"}
        </button>
        <Link
          href="/tests"
          className="block w-full rounded-full border border-indigo-300 px-6 py-3 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
        >
          검사 목록으로 돌아가기
        </Link>
      </div>

      {showDetail && participant && (
        <div className="space-y-10">
          {results.inhibition && (
            <section>
              <StoryInhibitionReport
                trials={results.inhibition.trials}
                anticipatoryThresholdMs={
                  results.inhibition.settings?.anticipatoryThresholdMs ?? defaultInhibitionConfig.anticipatoryThresholdMs
                }
                participant={participant}
              />
            </section>
          )}
          {results.workingMemory && (
            <section>
              <StoryWorkingMemoryReport trials={results.workingMemory.trials} participant={participant} />
            </section>
          )}
          {results.flexibility && (
            <section>
              <StoryFlexibilityReport trials={results.flexibility.trials} participant={participant} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// 임명장: 인쇄했을 때 한 장으로 나오도록 테두리를 두릅니다.
function Certificate({ participant, date }: { participant: ParticipantInfo; date: string }) {
  return (
    <section
      className="rounded-3xl border-8 border-double border-amber-400 bg-amber-50 p-8 text-center shadow-sm print:break-inside-avoid print:shadow-none"
      aria-label="수호대 임명장"
    >
      <p className="text-4xl" aria-hidden="true">
        🎖️
      </p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-widest text-amber-900">임 명 장</h2>
      <p className="mt-6 text-sm text-amber-800">
        {gradeLabel(participant.grade)}
        {participant.grade === "preschool" ? "" : ` (${ageGroupLabel(participant.ageGroup)})`}
      </p>
      <p className="mt-1 text-3xl font-extrabold text-slate-900">{participant.name}</p>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-amber-900">
        위 요원은 지구 수호대 작전의 세 가지 임무
        <br />
        <strong>요원 선별 · 신호 기억 · 규칙 변경</strong>을 끝까지 해냈기에
        <br />
        이에 <strong>지구 수호대 요원</strong>으로 임명합니다.
      </p>
      <p className="mt-6 text-sm text-amber-800">{date}</p>
      <p className="mt-1 text-sm font-semibold text-amber-900">🧑‍🚀 지구 수호대 본부 대장</p>
    </section>
  );
}

function PartSummaryCard({
  part,
  result,
}: {
  part: (typeof PARTS)[number];
  result: TestSessionSummary | null;
}) {
  const rows = result ? summaryRows(part.domain, result) : null;
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold text-slate-400">
        {part.part} · {part.title}
      </p>
      {rows ? (
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {rows.map((row) => (
            <li key={row.label} className="flex justify-between gap-2">
              <span>{row.label}</span>
              <strong className="text-slate-900">{row.value}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-400">아직 하지 않았어요.</p>
      )}
    </div>
  );
}

function ms(value: number | null): string {
  return value !== null ? `${value}ms` : "-";
}

function summaryRows(domain: EFDomain, result: TestSessionSummary): { label: string; value: string }[] {
  if (domain === "inhibition") {
    const stages = summarizeByStage(result.trials);
    const allyHits = stages.reduce((sum, s) => sum + s.allyHits, 0);
    const allyTotal = stages.reduce((sum, s) => sum + s.allyTotal, 0);
    const holds = stages.reduce((sum, s) => sum + s.enemyHolds, 0);
    const enemyTotal = stages.reduce((sum, s) => sum + s.enemyTotal, 0);
    const analysis = analyzeInhibitionTrials(
      result.trials,
      result.settings?.anticipatoryThresholdMs ?? defaultInhibitionConfig.anticipatoryThresholdMs
    );
    return [
      { label: "아군에게 인사", value: `${allyHits} / ${allyTotal}` },
      { label: "적군 참기", value: `${holds} / ${enemyTotal}` },
      { label: "인사 평균 속도", value: ms(analysis.meanRT) },
    ];
  }
  if (domain === "workingMemory") {
    const capacity = analyzeCapacityTrials(result.trials);
    const span = analyzeWorkingMemoryTrials(result.trials);
    return [
      { label: "보급품 최대 개수", value: `${capacity.maxSizeAllCorrect}개` },
      { label: "찾아낸 물건 비율", value: `${capacity.hitRate}%` },
      { label: "신호 최대 길이", value: `${span.maxSpanAchieved}개` },
    ];
  }
  const analysis = analyzeFlexibilityTrials(result.trials);
  const blocks = summarizeByBlock(result.trials);
  const correct = blocks.reduce((sum, b) => sum + b.correct, 0);
  const total = blocks.reduce((sum, b) => sum + b.trials, 0);
  return [
    { label: "맞게 나눈 신호", value: `${correct} / ${total}` },
    { label: "평균 속도", value: ms(analysis.repeatMeanRT !== null && analysis.switchMeanRT !== null ? Math.round((analysis.repeatMeanRT + analysis.switchMeanRT) / 2) : null) },
    { label: "암호 바뀐 직후 속도 차", value: ms(analysis.switchCostRT) },
  ];
}

// 대장의 편지: 해낸 일을 사실 그대로 적습니다. 잘했다/못했다 같은 평가는 하지 않습니다.
function buildLetter(results: StoryResults, name: string): { part: string; text: string }[] {
  const lines: { part: string; text: string }[] = [];

  if (results.inhibition) {
    const stages = summarizeByStage(results.inhibition.trials);
    const allyHits = stages.reduce((sum, s) => sum + s.allyHits, 0);
    const holds = stages.reduce((sum, s) => sum + s.enemyHolds, 0);
    lines.push({
      part: "1부 요원 선별",
      text: `${name} 요원은 행성, UFO, 변장한 요원 3단계를 끝까지 마쳤네. 아군에게 ${allyHits}번 인사하고, 적군은 ${holds}번 꾹 참았지.`,
    });
  }
  if (results.workingMemory) {
    const capacity = analyzeCapacityTrials(results.workingMemory.trials);
    const span = analyzeWorkingMemoryTrials(results.workingMemory.trials);
    const cap =
      capacity.maxSizeAllCorrect > 0
        ? `보급품은 한꺼번에 최대 ${capacity.maxSizeAllCorrect}개까지 모두 찾았고`
        : "보급품 찾기에 끝까지 도전했고";
    const sig =
      span.maxSpanAchieved > 0
        ? `기지 신호는 최대 ${span.maxSpanAchieved}개까지 순서대로 보냈네.`
        : "기지 신호도 끝까지 도전했네.";
    lines.push({ part: "2부 신호 기억", text: `${cap}, ${sig}` });
  }
  if (results.flexibility) {
    const blocks = summarizeByBlock(results.flexibility.trials);
    const total = blocks.reduce((sum, b) => sum + b.trials, 0);
    const analysis = analyzeFlexibilityTrials(results.flexibility.trials);
    const switchNote =
      analysis.switchCostRT !== null && analysis.switchCostRT > 0
        ? ` 암호가 바뀐 직후에는 ${analysis.switchCostRT}ms 더 걸렸는데, 바뀐 암호로 마음을 돌릴 때 누구나 잠깐 걸리는 시간이네.`
        : "";
    lines.push({
      part: "3부 규칙 변경",
      text: `색깔 암호, 모양 암호, 수시로 바뀌는 암호까지 신호 ${total}개를 나눴네.${switchNote}`,
    });
  }
  return lines;
}
