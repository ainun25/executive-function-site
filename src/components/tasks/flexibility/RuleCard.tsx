import type { ReactNode } from "react";
import type { RuleType } from "@/lib/flexibilityEngine";

// 규칙을 그림으로 설명하는 카드입니다. 검사 소개, 규칙이 바뀔 때 안내 화면에서 함께 씁니다.
//  - 색깔 규칙: 빨강 → 왼쪽, 파랑 → 오른쪽
//  - 모양 규칙: 원 → 왼쪽, 세모 → 오른쪽
// 검사 중에는 규칙 단서를 계속 보여주지 않으므로, 이 카드로 한 번 분명히 알려줍니다.
// 색만으로 구분하지 않도록 글자와 모양 기호를 함께 보여줍니다.

export const RULE_NAME: Record<RuleType, string> = { color: "색깔 규칙", shape: "모양 규칙" };
export const STORY_RULE_NAME: Record<RuleType, string> = { color: "색깔 암호", shape: "모양 암호" };

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
  const label = dark ? "text-slate-100" : "text-slate-700";
  return (
    <div
      className={`rounded-2xl p-4 text-center ${
        dark ? "bg-white/5 ring-1 ring-white/20" : "bg-indigo-50 ring-1 ring-indigo-200"
      }`}
    >
      <p className={`text-base font-extrabold ${dark ? "text-[#00ff88]" : "text-slate-900"}`}>{title ?? RULE_NAME[rule]}</p>
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
        규칙은 한동안 이어지다가 바뀌어요. 바뀔 때만 이 설명을 한 번 보여주고, 그 뒤에는 규칙을 기억해서
        진행해요.
      </p>
    </div>
  );
}
