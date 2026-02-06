-- ============================================================
-- alllovech 교회 홈페이지 — 초기 스키마
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. profiles (교인 프로필)
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  name       text not null default '',
  role       text not null default 'member'
               check (role in ('member', 'admin')),
  phone      text,
  group_id   uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 회원가입 시 프로필 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. posts (커뮤니티 게시판)
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid references auth.users on delete set null,
  title      text not null,
  content    text not null default '',
  category   text not null default 'general'
               check (category in ('general', 'prayer', 'testimony')),
  is_public  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. groups (소그룹 / 셀)
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  leader_id   uuid references auth.users on delete set null,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 4. group_members (소그룹 ↔ 교인 다대다)
create table if not exists public.group_members (
  group_id  uuid references public.groups on delete cascade,
  user_id   uuid references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- 5. givings (헌금 — 절대 공개 불가)
create table if not exists public.givings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  amount     integer not null,
  category   text not null default 'tithe'
               check (category in ('tithe', 'offering', 'mission', 'other')),
  memo       text,
  given_at   date not null default current_date,
  created_at timestamptz not null default now()
);

-- 6. visibility_settings (섹션별 랜딩 노출 설정)
create table if not exists public.visibility_settings (
  section               text primary key,
  is_visible_on_landing boolean not null default false,
  max_items             integer not null default 3,
  updated_at            timestamptz not null default now()
);

-- 기본 섹션 시드
insert into public.visibility_settings (section, is_visible_on_landing, max_items)
values
  ('community', false, 3),
  ('groups', false, 3)
on conflict (section) do nothing;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.posts               enable row level security;
alter table public.groups              enable row level security;
alter table public.group_members       enable row level security;
alter table public.givings             enable row level security;
alter table public.visibility_settings enable row level security;

-- ── profiles ──
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- ── posts ──
create policy "posts_select_authenticated"
  on public.posts for select
  to authenticated using (true);

create policy "posts_select_public_anon"
  on public.posts for select
  to anon using (is_public = true);

create policy "posts_insert_authenticated"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id);

create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- ── groups ──
create policy "groups_select_authenticated"
  on public.groups for select
  to authenticated using (true);

create policy "groups_select_public_anon"
  on public.groups for select
  to anon using (is_public = true);

-- ── group_members ──
create policy "group_members_select_authenticated"
  on public.group_members for select
  to authenticated using (true);

-- ── givings (본인만) ──
create policy "givings_select_own"
  on public.givings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "givings_insert_own"
  on public.givings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ── visibility_settings ──
create policy "visibility_select_anyone"
  on public.visibility_settings for select
  using (true);

create policy "visibility_update_authenticated"
  on public.visibility_settings for update
  to authenticated using (true);
