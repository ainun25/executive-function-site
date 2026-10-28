import type { ReactNode } from "react";
import type { RuleType } from "@/lib/flexibilityEngine";

// 규칙을 그림으로 설명하는 카드입니다. 검사 소개, 규칙이 바뀔 때 안내 화면에서 함께 씁니다.
//  - 색깔 규칙: 자극 창에 프레임(노란 테두리)이 없음. 빨강 → 왼쪽, 파랑 → 오른쪽
//  - 모양 규칙: 자극 창에 프레임(노란 테두리)이 있음. 원 → 왼쪽, 세모 → 오른쪽
// 색만으로 구분하지 않도록 글자와 모양 기호를 함께 보여줍니다.

export const RULE_NAME: Record<RuleType, string> = { color: "색깔 규칙", shape: "모양 규칙" };
export const STORY_RULE_NAME: Record<RuleType, string> = { color: "색깔 암호", shape: "모양 암호" };

export const RULE_FRAME_NOTE: Record<RuleType, string> = {
  color: "프레임이 없으면 → 색깔로 나눠요",
  shape: "노란 프레임이 있으면 → 모양으로 나눠요",
};

const HEX = { red: "#f43f5e", blue: "#0ea5e9" };

function Circle({ color }: { color: string }) {
  return <span className="inline-block h-8 w-8 rounded-full" style={{ backgroundColor: color }} />;
}

function Triangle({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-0 w-0"
      style={{
        borderLeft: "16px solid transparent",
        borderRight: "16px solid transparent",
        borderBottom: `28px solid ${color}`,
      }}
    />
  );
}

function SideBox({ side, children, dark }: { side: "left" | "right"; children: ReactNode; dark?: boolean }) {
  return (
    <div className={`flex flex-1 flex-col items-center gap-1 rounded-xl p-2 ${dark ? "bg-white/10" : "bg-white"}`}>
      <p className={`text-xs font-bold ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {side === "left" ? "← 왼쪽 버튼" : "오른쪽 버튼 →"}
      </p>
      {children}
    </div>
  );
}

export function RuleCard({
  rule,
  title,
  dark,
}: {
  rule: RuleType;
  title?: string;
  dark?: boolean;
}) {
  const framed = rule === "shape";
  const label = dark ? "text-slate-100" : "text-slate-700";
  return (
    <div
      className={`rounded-2xl p-4 text-center ${
        dark ? "bg-white/5 ring-1 ring-white/20" : framed ? "bg-amber-50 ring-1 ring-amber-200" : "bg-indigo-50 ring-1 ring-indigo-200"
      }`}
    >
      <p className={`text-base font-extrabold ${dark ? "text-[#00ff88]" : "text-slate-900"}`}>{title ?? RULE_NAME[rule]}</p>
      <div className="mt-3 flex justify-center">
        {/* 자극 창 모양 예시: 모양 규칙이면 프레임이 있어요 */}
        <div
          className={`flex h-14 w-24 items-center justify-center rounded-xl text-xs font-semibold ${
            framed
              ? "border-4 border-amber-400 bg-amber-100 text-amber-800"
              : dark
                ? "border border-white/30 bg-white/10 text-slate-200"
                : "border border-slate-300 bg-white text-slate-500"
          }`}
        >
          {framed ? "프레임 있음" : "프레임 없음"}
        </div>
      </div>
      <p className={`mt-2 text-xs ${dark ? "text-slate-300" : "text-slate-500"}`}>{RULE_FRAME_NOTE[rule]}</p>
      <div className="mt-3 flex gap-2">
        {rule === "color" ? (
          <>
            <SideBox side="left" dark={dark}>
              <Circle color={HEX.red} />
              <span className={`text-sm font-bold ${label}`}>🔴 빨강</span>
            </SideBox>
            <SideBox side="right" dark={dark}>
              <Circle color={HEX.blue} />
              <span className={`text-sm font-bold ${label}`}>🔵 파랑</span>
            </SideBox>
          </>
        ) : (
          <>
            <SideBox side="left" dark={dark}>
              <Circle color="#64748b" />
              <span className={`text-sm font-bold ${label}`}>● 원</span>
            </SideBox>
            <SideBox side="right" dark={dark}>
              <Triangle color="#64748b" />
              <span className={`text-sm font-bold ${label}`}>▲ 세모</span>
            </SideBox>
          </>
        )}
      </div>
    </div>
  );
}

// 검사 소개 화면에서 두 규칙을 나란히 설명합니다.
export function RuleGuide({ dark, story }: { dark?: boolean; story?: boolean }) {
  const names = story ? STORY_RULE_NAME : RULE_NAME;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <RuleCard rule="color" title={names.color} dark={dark} />
        <RuleCard rule="shape" title={names.shape} dark={dark} />
      </div>
      <p className={`text-center text-xs leading-relaxed ${dark ? "text-slate-300" : "text-slate-500"}`}>
        규칙이 바뀔 때마다 이 설명을 다시 보여줘요. 그리고 규칙은 한동안 이어지다가 바뀌어요. 버튼에도 지금
        규칙의 기준이 적혀 있어요.
      </p>
    </div>
  );
}
