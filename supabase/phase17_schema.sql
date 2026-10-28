-- 실행기능 놀이터 - PHASE 17 데이터베이스 스키마 (훈련자료 파일 업로드 저장소)
--
-- 사용 방법: 이전 마이그레이션들을 실행하셨다면 이 파일만 추가로 SQL Editor에서 실행하세요.
-- (phase16_schema.sql의 is_admin() 함수가 먼저 만들어져 있어야 합니다.)
--
-- 목적: 관리자가 훈련자료에 PDF/이미지 파일을 직접 올릴 수 있게 합니다.
--  - 올리기/지우기: 관리자만
--  - 열어보기: 누구나 (훈련자료를 보는 아이들이 열어야 하므로, 공개 저장소로 만듭니다)
--  - 제한: PDF, PNG, JPG만 / 파일당 최대 10MB
-- ⚠️ 공개 저장소이므로 파일 주소를 아는 사람은 누구나 열 수 있습니다.
--    아이 이름 등 개인정보가 들어 있는 파일은 올리지 마세요.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'training-files',
  'training-files',
  true,
  10485760, -- 10MB
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg'];

drop policy if exists "admins can upload training-files" on storage.objects;
create policy "admins can upload training-files"
  on storage.objects for insert
  with check (bucket_id = 'training-files' and public.is_admin());

drop policy if exists "admins can read training-files" on storage.objects;
create policy "admins can read training-files"
  on storage.objects for select
  using (bucket_id = 'training-files' and public.is_admin());

drop policy if exists "admins can delete training-files" on storage.objects;
create policy "admins can delete training-files"
  on storage.objects for delete
  using (bucket_id = 'training-files' and public.is_admin());
