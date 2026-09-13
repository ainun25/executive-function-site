-- 실행기능 놀이터 - PHASE 8 데이터베이스 스키마 (검색 자료 + 훈련자료 + 관리자 인증)
--
-- 사용 방법: supabase/schema.sql을 이미 실행하셨다면, 이 파일만 추가로
-- SQL Editor에 붙여넣고 실행하면 됩니다. (기존 테이블은 건드리지 않습니다.)
--
-- 관리자 인증 안내:
-- 이 프로젝트는 아직 회원가입 화면이 없습니다. 관리자 계정은
-- Supabase 대시보드 → Authentication → Users → "Add user"에서
-- 이메일/비밀번호로 직접 한 번만 만들어주세요. 그 계정으로 로그인한
-- 사람은 누구나 관리자 화면(등록/수정/삭제)을 사용할 수 있습니다.
-- (실제 서비스로 전환할 때는 "관리자 역할" 테이블을 별도로 만들어
-- 로그인한 사람 중에서도 관리자만 구분하도록 정책을 강화해야 합니다.)

-- 실행기능 찾아보기(검색)에서 보여줄 자료 (섹션 5)
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  category text not null check (category in ('concept', 'research', 'education', 'training', 'webResource')),
  keywords text[] not null default '{}',
  source text,
  author text,
  year integer,
  url text,
  created_at timestamptz not null default now()
);

-- 훈련자료 (섹션 15)
create table if not exists training_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('inhibition', 'workingMemory', 'flexibility', 'combined')),
  target_grade text,
  difficulty text check (difficulty in ('쉬움', '보통', '어려움')),
  duration_minutes integer,
  description text not null,
  materials text,
  activity_steps text,
  learning_goal text,
  file_url text,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists idx_content_items_category on content_items (category);
create index if not exists idx_training_materials_category on training_materials (category);

alter table content_items enable row level security;
alter table training_materials enable row level security;

-- 누구나 검색/훈련자료를 읽을 수 있어야 합니다 (로그인 불필요).
drop policy if exists "anyone can read content_items" on content_items;
create policy "anyone can read content_items"
  on content_items for select
  using (true);

drop policy if exists "anyone can read training_materials" on training_materials;
create policy "anyone can read training_materials"
  on training_materials for select
  using (true);

-- 등록/수정/삭제는 로그인한 사람(관리자)만 가능합니다.
drop policy if exists "authenticated can manage content_items" on content_items;
create policy "authenticated can manage content_items"
  on content_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "authenticated can manage training_materials" on training_materials;
create policy "authenticated can manage training_materials"
  on training_materials for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 처음 화면이 비어 보이지 않도록 예시 자료를 몇 개 넣어둡니다.
insert into content_items (title, summary, category, keywords, source, author, year, url)
values
  ('실행기능이란 무엇인가', '목표를 정하고 생각과 행동을 조절하는 인지적 조절 능력에 대한 기본 개념 설명.', 'concept', array['실행기능','개념'], '사이트 내부 자료', null, null, null),
  ('억제통제와 학습의 관계', '억제통제 능력이 수업 중 충동 조절과 어떻게 연결되는지 정리한 자료.', 'education', array['억제통제','학습','주의집중'], '사이트 내부 자료', null, null, null),
  ('작업기억과 문제 해결', '작업기억이 여러 단계 문제를 풀 때 어떻게 사용되는지 설명하는 자료.', 'education', array['작업기억','문제해결'], '사이트 내부 자료', null, null, null),
  ('인지적 유연성과 감정조절', '규칙 전환 능력이 감정조절 및 새로운 상황 적응과 맺는 관계를 다룬 자료.', 'concept', array['인지적 유연성','감정조절'], '사이트 내부 자료', null, null, null)
on conflict do nothing;

insert into training_materials (title, category, target_grade, difficulty, duration_minutes, description, materials, activity_steps, learning_goal, source)
values
  ('멈춰! 신호등 게임', 'inhibition', '초등 1~3학년', '쉬움', 10, '신호에 따라 움직이거나 멈추는 연습으로 억제통제를 길러주는 활동이에요.', '색깔 카드(빨강/초록) 또는 신호등 그림', '1) 초록 신호에서는 자유롭게 움직인다. 2) 빨강 신호가 나오면 즉시 멈춘다. 3) 반복하며 속도를 조금씩 올린다.', '충동적인 행동을 멈추고 신호에 맞춰 행동을 조절하는 연습', '사이트 내부 제작'),
  ('순서 기억 카드놀이', 'workingMemory', '초등 2~4학년', '보통', 15, '카드의 순서를 기억했다가 다시 맞춰보는 놀이로 작업기억을 훈련해요.', '그림 카드 6~8장', '1) 카드를 순서대로 짧게 보여준다. 2) 카드를 뒤집는다. 3) 학생이 본 순서대로 다시 나열한다.', '여러 개의 정보를 순서대로 기억하고 재현하는 능력 훈련', '사이트 내부 제작'),
  ('규칙 바꾸기 놀이', 'flexibility', '초등 3~6학년', '보통', 15, '분류 규칙이 중간에 바뀌는 놀이를 통해 인지적 유연성을 연습해요.', '색깔/모양이 다른 도형 카드', '1) 색깔 규칙으로 카드를 분류한다. 2) 신호를 주고 모양 규칙으로 바꾼다. 3) 두 규칙을 번갈아 가며 진행한다.', '바뀐 규칙에 맞춰 생각과 행동을 유연하게 전환하는 연습', '사이트 내부 제작')
on conflict do nothing;
