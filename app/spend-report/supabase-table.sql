-- Supabase 대시보드 → SQL Editor에서 한 번 실행하세요.
-- 지출 보고 앱용 테이블 (사진은 저장하지 않음, 내역·금액·날짜만 저장)
-- RLS 사용 중이면: Table Editor → spend_report → RLS 정책에서 anon용 select, insert 허용

create table if not exists spend_report (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount integer not null,
  description text,
  created_at timestamptz default now()
);

-- 정렬/조회용
create index if not exists spend_report_date_idx on spend_report (date desc);
