-- 실행기능 놀이터 - PHASE 10 데이터베이스 스키마 (참여자 이름/나이 + 보안 강화)
--
-- 사용 방법: schema.sql, phase8_schema.sql을 이미 실행하셨다면
-- 이 파일만 추가로 SQL Editor에 붙여넣고 실행하면 됩니다.
--
-- ⚠️ 중요: 이제 검사 세션에 아이의 실명과 나이가 저장됩니다.
-- 지금까지는 test_sessions/trials를 "누구나" 조회할 수 있었는데(참여자ID가
-- 익명이라 문제가 적었음), 실명이 들어가는 순간 이는 심각한 개인정보
-- 유출 위험이 됩니다. 그래서 이 파일은 조회 권한을 관리자(로그인한
-- 사람)만 가능하도록 반드시 강화합니다.

-- 1) 참여자 이름/나이 컬럼 추가
alter table test_sessions add column if not exists participant_name text;
alter table test_sessions add column if not exists age_years integer;
alter table test_sessions add column if not exists age_months integer;

-- 2) 보안 강화: 검사 결과 조회는 이제 로그인한 사람(관리자)만 가능합니다.
--    저장(insert)은 계속 누구나 가능해야 합니다 (아이들이 로그인 없이 검사하니까요).
drop policy if exists "anyone can read test_sessions" on test_sessions;
create policy "authenticated can read test_sessions"
  on test_sessions for select
  using (auth.role() = 'authenticated');

drop policy if exists "anyone can read trials" on trials;
create policy "authenticated can read trials"
  on trials for select
  using (auth.role() = 'authenticated');
