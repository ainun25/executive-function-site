-- 실행기능 놀이터 - PHASE 11 데이터베이스 스키마 (검사 결과 요약 저장)
--
-- 사용 방법: 이전 마이그레이션들을 이미 실행하셨다면 이 파일만 추가로 실행하면 됩니다.
--
-- 목적: 검사가 끝날 때마다 정확도/반응시간 등 요약 지표를 계산해서
-- test_sessions 한 행에 함께 저장합니다. 나중에 연령별 평균 등
-- 표준화 작업을 할 때 문항별 원자료를 매번 다시 계산하지 않고,
-- 이 요약 컬럼만으로 바로 통계를 낼 수 있습니다.

alter table test_sessions add column if not exists summary jsonb;

comment on column test_sessions.summary is
  '검사 종류별 분석 결과(JSON). 예: {"overallAccuracy":87,"meanRT":624,...}';
