-- ============================================================
-- 관리자가 다른 교인 프로필을 수정할 수 있도록 RLS 정책 추가
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
