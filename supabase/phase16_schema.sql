-- 실행기능 놀이터 - PHASE 16 데이터베이스 스키마 (관리자 역할 구분 / 보안 강화)
--
-- 사용 방법: 이전 마이그레이션들을 실행하셨다면 이 파일만 추가로 SQL Editor에서 실행하세요.
--
-- 문제: 지금까지는 "로그인한 사람이면 누구나" 관리자 권한(결과 조회/삭제, 자료 수정)을 가졌습니다.
-- Supabase는 누구나 회원가입으로 로그인 가능한 계정을 만들 수 있어서, 가입을 막지 않으면
-- 외부 사람이 계정을 만들어 아이들의 이름과 검사 결과를 볼 수 있습니다.
--
-- 해결: "관리자 목록(admin_users)"을 만들고, 그 목록에 등록된 계정만 관리자 권한을 갖게 합니다.
-- (신규 가입 자체를 끄는 설정은 SQL이 아니라 Supabase 대시보드에서 따로 해야 합니다.)
--
-- 안전장치: 관리자 등록이 하나도 안 되면 아래 do 블록이 오류를 내서 이 파일 전체가 취소됩니다.
-- (규칙만 바뀌고 관리자가 잠기는 사고를 막기 위함)

-- 1) 관리자 목록
create table if not exists admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

-- 로그인한 본인이 "내가 관리자인지" 확인할 수 있게만 허용합니다.
-- 관리자 추가/삭제는 이 화면(앱)에서는 할 수 없고, SQL Editor에서만 할 수 있습니다.
drop policy if exists "users can read own admin row" on admin_users;
create policy "users can read own admin row"
  on admin_users for select
  using (user_id = auth.uid());

-- 2) "지금 로그인한 사람이 관리자인가?"를 판단하는 함수 (다른 규칙들이 이걸 사용합니다)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- 3) 첫 관리자 등록 (Supabase Authentication에 만들어 둔 계정의 이메일)
insert into admin_users (user_id, email)
select id, email from auth.users where email = 'ainun25@gmail.com'
on conflict (user_id) do nothing;

do $$
begin
  if not exists (select 1 from admin_users) then
    raise exception '관리자 계정을 찾지 못했어요. 위 insert 문의 이메일이 Authentication > Users의 이메일과 같은지 확인해주세요.';
  end if;
end
$$;

-- 4) "로그인한 사람" 규칙을 "관리자" 규칙으로 교체
-- 검사 결과(이름 포함): 관리자만 조회/삭제 (저장은 아이들이 로그인 없이 해야 하므로 그대로 둡니다)
drop policy if exists "authenticated can read test_sessions" on test_sessions;
drop policy if exists "admins can read test_sessions" on test_sessions;
create policy "admins can read test_sessions"
  on test_sessions for select
  using (public.is_admin());

drop policy if exists "authenticated can delete test_sessions" on test_sessions;
drop policy if exists "admins can delete test_sessions" on test_sessions;
create policy "admins can delete test_sessions"
  on test_sessions for delete
  using (public.is_admin());

drop policy if exists "authenticated can read trials" on trials;
drop policy if exists "admins can read trials" on trials;
create policy "admins can read trials"
  on trials for select
  using (public.is_admin());

-- 자료/설명/훈련자료/검사 설정: 읽기는 누구나(그대로), 등록·수정·삭제는 관리자만
drop policy if exists "authenticated can manage content_items" on content_items;
drop policy if exists "admins can manage content_items" on content_items;
create policy "admins can manage content_items"
  on content_items for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "authenticated can manage training_materials" on training_materials;
drop policy if exists "admins can manage training_materials" on training_materials;
create policy "admins can manage training_materials"
  on training_materials for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "authenticated can manage ef_knowledge_cards" on ef_knowledge_cards;
drop policy if exists "admins can manage ef_knowledge_cards" on ef_knowledge_cards;
create policy "admins can manage ef_knowledge_cards"
  on ef_knowledge_cards for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "authenticated can manage test_age_group_settings" on test_age_group_settings;
drop policy if exists "admins can manage test_age_group_settings" on test_age_group_settings;
create policy "admins can manage test_age_group_settings"
  on test_age_group_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- 이전 단계에서 만든 예전 설정 표(현재는 사용 안 함)도 같은 기준으로 맞춥니다.
drop policy if exists "authenticated can manage test_settings" on test_settings;
drop policy if exists "admins can manage test_settings" on test_settings;
create policy "admins can manage test_settings"
  on test_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------
-- (참고) 나중에 관리자를 추가하려면 SQL Editor에서 아래를 실행하세요.
--   먼저 Authentication > Users에서 그 사람의 계정을 만든 뒤:
--   insert into admin_users (user_id, email)
--   select id, email from auth.users where email = '추가할_이메일@example.com';
-- (관리자 계정을 삭제하고 다시 만들면 user_id가 바뀌므로, 위 insert를 다시 실행해야 합니다.)
-- ------------------------------------------------------------------
