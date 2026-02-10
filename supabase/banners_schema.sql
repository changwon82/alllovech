-- ============================================================
-- 메인 비주얼·행사 배너 관리 (공개 배너)
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 배너 테이블: 히어로 캐러셀 이미지 + 행사 광고 배너
create table if not exists public.public_banners (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('hero', 'promotion')),
  title      text not null default '',
  subtitle   text default '',
  link       text default '',
  image_url  text not null,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  starts_at  timestamptz default null,
  ends_at    timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.public_banners is '공개 메인 비주얼(히어로) 및 행사 광고 배너. type=hero: 웰컴 페이지 캐러셀, type=promotion: 행사 광고.';

-- RLS
alter table public.public_banners enable row level security;

-- 누구나 읽기 (공개)
create policy "banners_select_all"
  on public.public_banners for select using (true);

-- 관리자만 쓰기
create policy "banners_admin_all"
  on public.public_banners for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 인덱스
create index if not exists idx_public_banners_type_order
  on public.public_banners (type, sort_order);

-- ============================================================
-- 스토리지 버킷 (이미지 업로드)
-- Supabase Dashboard > Storage에서 'banners' 버킷을 public으로 생성하거나,
-- 아래는 참고용입니다. 버킷이 없으면 Dashboard에서 생성 후
-- Policies에서 "Public read" + "Authenticated upload (admin만)" 설정하세요.
-- ============================================================
-- 버킷 생성 (Dashboard에서 하셔도 됨):
--   Storage > New bucket > Name: banners, Public: ON
-- 정책 예시:
--   - SELECT: public (모든 사용자)
--   - INSERT: auth.role() = 'authenticated' 이고 profiles.role = 'admin' (서비스 역할 또는 RLS로 admin만)
--   - UPDATE/DELETE: 동일
