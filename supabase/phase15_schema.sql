-- 실행기능 놀이터 - PHASE 15 데이터베이스 스키마 (학년/연령군별 검사 설정)
--
-- 사용 방법: 이전 마이그레이션들을 실행하셨다면 이 파일만 추가로 SQL Editor에서 실행하세요.
--
-- 1) 검사 결과(test_sessions)에 학년과 연령군을 함께 기록합니다.
-- 2) 검사 설정을 (검사 종류 x 연령군)마다 따로 저장하는 새 표를 만듭니다.
--    연령군: preschool(예비초등) / lower(초등 1~3학년) / upper(초등 4~6학년)
--    설정이 없으면 코드의 연령군별 기본값을 사용하므로 처음에는 비어 있어도 됩니다.
--    (이전 단계에서 만든 test_settings 표는 더 이상 쓰지 않지만, 지우지 않고 그대로 둡니다.)

alter table test_sessions add column if not exists grade text;
alter table test_sessions add column if not exists age_group text;

create table if not exists test_age_group_settings (
  domain text not null check (domain in ('inhibition', 'workingMemory', 'flexibility')),
  age_group text not null check (age_group in ('preschool', 'lower', 'upper')),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (domain, age_group)
);

alter table test_age_group_settings enable row level security;

drop policy if exists "anyone can read test_age_group_settings" on test_age_group_settings;
create policy "anyone can read test_age_group_settings"
  on test_age_group_settings for select
  using (true);

drop policy if exists "authenticated can manage test_age_group_settings" on test_age_group_settings;
create policy "authenticated can manage test_age_group_settings"
  on test_age_group_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
