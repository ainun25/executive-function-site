"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useAdminSession } from "@/lib/useAdminSession";
import ContentManager from "@/components/admin/ContentManager";
import TrainingManager from "@/components/admin/TrainingManager";
import RawDataViewer from "@/components/admin/RawDataViewer";
import SessionSummaryViewer from "@/components/admin/SessionSummaryViewer";

export default function AdminPage() {
  const { session, isLoading, isLoggedIn } = useAdminSession();

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-slate-500">
          Supabase가 설정되어 있지 않아 관리자 기능을 사용할 수 없어요. `.env.local`을 먼저
          설정해주세요.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-slate-400">확인 중...</div>;
  }

  if (!isLoggedIn) {
    return <AdminLoginForm />;
  }

  return <AdminDashboard email={session?.user.email ?? ""} />;
}

function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);
    if (error) {
      // 디버깅을 위해 Supabase가 알려주는 원래 오류 메시지를 그대로 보여줍니다.
      setErrorMessage(`로그인 실패: ${error.message}`);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-center text-2xl font-bold text-slate-900">관리자 로그인</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        관리자 계정은 Supabase 대시보드에서 발급받은 이메일/비밀번호를 사용해요.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
        />
        <input
          type="password"
          required
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
        />
        {errorMessage && <p className="text-sm text-indigo-600">{errorMessage}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}

function AdminDashboard({ email }: { email: string }) {
  const [activeTab, setActiveTab] = useState<"summary" | "content" | "training" | "rawData">("summary");

  const handleLogout = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">관리자 페이지</h1>
          <p className="text-sm text-slate-500">{email}로 로그인됨</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          로그아웃
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton label="검사 결과 요약" isActive={activeTab === "summary"} onClick={() => setActiveTab("summary")} />
        <TabButton label="실행기능 자료 관리" isActive={activeTab === "content"} onClick={() => setActiveTab("content")} />
        <TabButton label="훈련자료 관리" isActive={activeTab === "training"} onClick={() => setActiveTab("training")} />
        <TabButton
          label="문항별 상세 원자료"
          isActive={activeTab === "rawData"}
          onClick={() => setActiveTab("rawData")}
        />
      </div>

      {activeTab === "summary" && <SessionSummaryViewer />}
      {activeTab === "content" && <ContentManager />}
      {activeTab === "training" && <TrainingManager />}
      {activeTab === "rawData" && <RawDataViewer />}
    </div>
  );
}

function TabButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        isActive ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
