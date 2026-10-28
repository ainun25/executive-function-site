-- 실행기능 놀이터 - PHASE 18 데이터베이스 스키마 (검사 유형: 표준형 / 스토리형)
--
-- 사용 방법: 이전 마이그레이션들을 실행하셨다면 이 파일만 추가로 SQL Editor에서 실행하세요.
--
-- 목적: 같은 영역의 검사라도 "표준형"(고양이/호랑이 등)과 "스토리형"(지구 수호대 작전)은
-- 자극과 구성이 달라 점수를 직접 비교할 수 없습니다. 그래서 검사 결과마다 유형을 기록해
-- 나중에 유형별로 따로 분석(표준화)할 수 있게 합니다.
-- 이미 쌓인 결과는 모두 'standard'(표준형)로 처리됩니다.

alter table test_sessions
  add column if not exists test_version text not null default 'standard'
  check (test_version in ('standard', 'story'));
