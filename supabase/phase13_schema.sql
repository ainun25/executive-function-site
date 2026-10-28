-- 실행기능 놀이터 - PHASE 13 데이터베이스 스키마 ("실행기능 알아보기" 설명 카드 관리)
--
-- 사용 방법: 이전 마이그레이션들을 실행하셨다면 이 파일만 추가로 SQL Editor에서 실행하세요.
--
-- 목적: "실행기능 알아보기" 페이지의 영역별 설명 카드를 관리자 화면에서
-- 추가/수정/삭제할 수 있게 합니다. 누구나 읽을 수 있고(로그인 불필요),
-- 변경은 로그인한 관리자만 할 수 있습니다.

create table if not exists ef_knowledge_cards (
  id uuid primary key default gen_random_uuid(),
  name_ko text not null,
  name_en text,
  concept text not null,
  examples text[] not null default '{}',
  learning_relation text,
  difficulty_signs text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table ef_knowledge_cards enable row level security;

drop policy if exists "anyone can read ef_knowledge_cards" on ef_knowledge_cards;
create policy "anyone can read ef_knowledge_cards"
  on ef_knowledge_cards for select
  using (true);

drop policy if exists "authenticated can manage ef_knowledge_cards" on ef_knowledge_cards;
create policy "authenticated can manage ef_knowledge_cards"
  on ef_knowledge_cards for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 처음 화면이 비어 보이지 않도록 기존 3개 영역 설명을 넣어둡니다.
-- (이미 카드가 있으면 다시 넣지 않습니다.)
insert into ef_knowledge_cards (name_ko, name_en, concept, examples, learning_relation, difficulty_signs, sort_order)
select * from (values
  ('억제통제', 'Inhibitory Control',
   '자동적으로 하려는 행동이나 충동을 멈추고, 그 대신 필요한 행동을 선택하는 능력입니다.',
   array['하고 싶은 말을 잠깐 멈추기','게임을 더 하고 싶어도 약속된 시간에 멈추기','방해 자극을 무시하고 필요한 것에 집중하기'],
   '수업 중 충동적으로 발언하거나 행동하지 않고, 필요한 순간까지 기다리는 데 도움을 줍니다.',
   array['순서를 기다리지 못함','생각 없이 즉각 행동하거나 말함','주변 자극에 쉽게 산만해짐'],
   1),
  ('작업기억', 'Working Memory',
   '필요한 정보를 잠시 머릿속에 유지하면서 동시에 사용하는 능력입니다.',
   array['여러 단계의 지시 기억하기','암산하기','읽은 내용을 기억하며 다음 내용을 이해하기'],
   '여러 단계로 된 지시를 따르거나, 문제를 풀며 이전 단계의 정보를 유지하는 데 필요합니다.',
   array['여러 단계 지시를 끝까지 따르지 못함','방금 들은 내용을 금방 잊어버림','긴 문제 풀이 중간에 앞부분을 잊음'],
   2),
  ('인지적 유연성', 'Cognitive Flexibility',
   '상황이나 규칙이 바뀌었을 때 생각이나 행동을 유연하게 바꿀 수 있는 능력입니다.',
   array['다른 해결 방법 찾기','규칙이 바뀌었을 때 새로운 규칙 적용하기','자신의 생각과 다른 관점 고려하기'],
   '문제 해결 방법이 통하지 않을 때 다른 전략으로 바꾸거나, 새로운 규칙에 적응하는 데 도움을 줍니다.',
   array['한 가지 방법을 고집함','규칙이 바뀌면 크게 혼란스러워함','다른 사람의 관점을 받아들이기 어려워함'],
   3)
) as seed(name_ko, name_en, concept, examples, learning_relation, difficulty_signs, sort_order)
where not exists (select 1 from ef_knowledge_cards);
