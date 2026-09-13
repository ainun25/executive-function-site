import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 환경변수(.env.local)가 설정되어 있지 않으면 supabase 기능 없이도
// 사이트가 정상 작동해야 합니다 (localStorage 데모 모드로 자동 대체).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
