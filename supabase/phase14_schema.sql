-- 실행기능 놀이터 - PHASE 14 데이터베이스 스키마 (검사 설정 관리)
--
-- 사용 방법: 이전 마이그레이션들을 실행하셨다면 이 파일만 추가로 SQL Editor에서 실행하세요.
--
-- 목적: 문항 수, 표시 시간 등 검사 설정을 관리자 화면에서 바꿀 수 있게 합니다.
-- 검사 종류(id: inhibition / workingMemory / flexibility)당 한 줄만 저장합니다.
-- 설정이 없으면 코드의 기본값을 사용하므로, 처음에는 비어 있어도 됩니다.
-- 누구나 읽을 수 있고(아이들이 검사할 때 필요), 변경은 로그인한 관리자만 할 수 있습니다.

create table if not exists test_settings (
  id text primary key check (id in ('inhibition', 'workingMemory', 'flexibility')),
  config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table test_settings enable row level security;

drop policy if exists "anyone can read test_settings" on test_settings;
create policy "anyone can read test_settings"
  on test_settings for select
  using (true);

drop policy if exists "authenticated can manage test_settings" on test_settings;
create policy "authenticated can manage test_settings"
  on test_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
