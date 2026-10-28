"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * 관리자 로그인 상태를 확인하는 훅입니다.
 * - isLoggedIn: 로그인했는지
 * - isAdmin: 로그인한 계정이 "관리자 목록(admin_users)"에 등록되어 있는지
 *
 * ⚠️ 이 값은 화면에 관리자 메뉴/기능을 보여줄지 정하는 "표시용"입니다.
 * 실제 보안(결과 조회, 자료 수정 권한)은 DB 규칙(RLS, phase16_schema.sql의 is_admin())이
 * 서버에서 강제하므로, 화면을 우회해도 관리자가 아니면 데이터에 접근할 수 없습니다.
 */
export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecking, setIsAdminChecking] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsSessionLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsSessionLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // 로그인 정보가 바뀔 때마다, 그 계정이 관리자 목록에 있는지 확인합니다.
  // (onAuthStateChange 콜백 안에서 바로 DB를 부르면 멈출 수 있어서, 별도 effect로 분리했습니다.)
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!supabase || !userId) {
      setIsAdmin(false);
      setIsAdminChecking(false);
      return;
    }

    let isCancelled = false;
    setIsAdminChecking(true);
    supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (isCancelled) return;
        if (error) console.warn("관리자 여부를 확인하지 못했습니다:", error.message);
        setIsAdmin(Boolean(data));
        setIsAdminChecking(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  return {
    session,
    isLoading: isSessionLoading || isAdminChecking,
    isLoggedIn: Boolean(session),
    isAdmin,
  };
}
