-- 실행기능 놀이터 - PHASE 12 데이터베이스 스키마 (검사 결과 삭제 권한)
--
-- 사용 방법: 이전 마이그레이션들을 실행하셨다면 이 파일만 추가로 SQL Editor에서 실행하세요.
--
-- 목적: 관리자 페이지에서 테스트로 쌓인 검사 결과를 삭제할 수 있게 합니다.
-- 삭제는 로그인한 사람(관리자)만 가능하며, 아이들이 쓰는 비로그인 화면에서는
-- 삭제할 수 없습니다. trials(문항별 원자료)는 test_sessions를 지울 때
-- on delete cascade 설정으로 함께 삭제됩니다.

drop policy if exists "authenticated can delete test_sessions" on test_sessions;
create policy "authenticated can delete test_sessions"
  on test_sessions for delete
  using (auth.role() = 'authenticated');
