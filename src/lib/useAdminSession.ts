"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * 관리자 로그인 상태를 확인하는 훅입니다.
 * 지금 단계에서는 별도의 "관리자 역할" 구분 없이, Supabase에 로그인한 사람을
 * 곧 관리자로 취급합니다 (관리자 계정은 Supabase 대시보드에서 직접 생성).
 * 실제 서비스로 전환할 때는 역할(role) 테이블을 추가해 구분해야 합니다.
 */
export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, isLoading, isLoggedIn: Boolean(session) };
}
