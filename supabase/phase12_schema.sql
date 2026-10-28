drop policy if exists "authenticated can delete test_sessions" on test_sessions;
create policy "authenticated can delete test_sessions"
  on test_sessions for delete
  using (auth.role() = 'authenticated');