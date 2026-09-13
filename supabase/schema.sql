-- 실행기능 놀이터 - PHASE 7 데이터베이스 스키마
--
-- 사용 방법:
-- 1. Supabase 대시보드 접속 → 프로젝트 선택
-- 2. 왼쪽 메뉴에서 "SQL Editor" 클릭
-- 3. "New query" 클릭 후 이 파일 내용을 전부 붙여넣기
-- 4. 우측 하단 "Run" 클릭
--
-- 개인정보 보호 원칙 (섹션 17):
-- - 실명은 저장하지 않습니다. participant_id는 브라우저가 자동으로 만든
--   익명 식별자일 뿐입니다.
-- - 학년/연령대 등은 지금 버전에서는 수집하지 않으며, 나중에 필요할 때
--   컬럼을 추가하는 방식으로 확장합니다.
-- - 실제 아동 대상 연구/서비스에 사용하려면 보호자 동의, 개인정보처리방침,
--   기관 연구윤리심의(IRB) 절차가 별도로 필요합니다. 이 스키마 자체는
--   그런 절차를 대신하지 않습니다.

-- 검사 세션 (한 번의 검사 실행 = 한 행)
create table if not exists test_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id text not null, -- 브라우저가 만든 익명 식별자 (실명 아님)
  task_type text not null check (task_type in ('inhibition', 'workingMemory', 'flexibility')),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  device_type text,
  browser text,
  screen_width integer,
  screen_height integer,
  created_at timestamptz not null default now()
);

-- 문항(trial) 단위 원자료 (한 문항 = 한 행)
create table if not exists trials (
  id bigint generated always as identity primary key,
  session_id uuid not null references test_sessions (id) on delete cascade,
  trial_number integer not null,
  task_type text not null,
  stimulus text,
  condition text,
  correct_answer text,
  user_answer text,
  is_correct boolean,
  reaction_time integer, -- ms
  is_omission boolean not null default false,
  is_commission_error boolean not null default false,
  trial_timestamp bigint not null, -- 문항 발생 시각 (epoch ms)
  valid_trial boolean not null default true,
  invalid_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_trials_session_id on trials (session_id);
create index if not exists idx_test_sessions_participant_id on test_sessions (participant_id);
create index if not exists idx_test_sessions_task_type on test_sessions (task_type);

-- Row Level Security 활성화
alter table test_sessions enable row level security;
alter table trials enable row level security;

-- 지금 단계(로그인 기능 없는 데모/프로토타입)에서는 누구나 자신의 결과를
-- 저장하고 자신의 participant_id로 조회할 수 있도록 허용합니다.
-- 주의: 이는 프로토타입용 임시 정책입니다. 실제 서비스로 전환할 때는
-- PHASE 8의 관리자 인증 및 사용자 인증 구조에 맞춰 정책을 다시 설계해야 합니다.
drop policy if exists "anyone can insert test_sessions" on test_sessions;
create policy "anyone can insert test_sessions"
  on test_sessions for insert
  with check (true);

drop policy if exists "anyone can insert trials" on trials;
create policy "anyone can insert trials"
  on trials for insert
  with check (true);

drop policy if exists "anyone can read test_sessions" on test_sessions;
create policy "anyone can read test_sessions"
  on test_sessions for select
  using (true);

drop policy if exists "anyone can read trials" on trials;
create policy "anyone can read trials"
  on trials for select
  using (true);
