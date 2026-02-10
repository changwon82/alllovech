-- ============================================================
-- Storage 버킷 "banners" + 관리자만 업로드 가능 정책
-- Supabase SQL Editor에서 실행하세요.
--
-- ※ 1번(버킷 생성)에서 권한 오류가 나면:
--    Dashboard > Storage > New bucket 로 "banners" 버킷을 먼저 만든 뒤
--    2번부터만 실행하세요.
-- ============================================================

-- 1. 버킷 생성 (이미 있으면 업데이트)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'banners',
  'banners',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- 2. 정책: 누구나 조회(읽기) 가능
drop policy if exists "banners_public_read" on storage.objects;
create policy "banners_public_read"
  on storage.objects for select
  using (bucket_id = 'banners');

-- 3. 정책: 관리자만 업로드(INSERT)
drop policy if exists "banners_admin_insert" on storage.objects;
create policy "banners_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'banners'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 4. 정책: 관리자만 수정(UPDATE)
drop policy if exists "banners_admin_update" on storage.objects;
create policy "banners_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'banners'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 5. 정책: 관리자만 삭제(DELETE)
drop policy if exists "banners_admin_delete" on storage.objects;
create policy "banners_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'banners'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
