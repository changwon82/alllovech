-- Supabase 대시보드 → SQL Editor에서 실행하세요.
-- "Bucket not found" 나오면: Dashboard → Storage → New bucket 먼저 만드세요.
-- 버킷 이름: spend-report-receipts, Public 체크, 파일 크기 제한 5MB

-- (선택) SQL로 버킷 생성 시도. 실패하면 위처럼 Dashboard에서 만드세요.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'spend-report-receipts',
  'spend-report-receipts',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 업로드/조회/삭제 허용 (public = anon + authenticated)
drop policy if exists "spend-report receipts upload" on storage.objects;
drop policy if exists "spend-report receipts read" on storage.objects;
drop policy if exists "spend-report receipts delete" on storage.objects;

create policy "spend-report receipts upload"
on storage.objects for insert to public
with check (bucket_id = 'spend-report-receipts');

create policy "spend-report receipts read"
on storage.objects for select to public
using (bucket_id = 'spend-report-receipts');

create policy "spend-report receipts delete"
on storage.objects for delete to public
using (bucket_id = 'spend-report-receipts');
