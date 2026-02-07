-- ============================================================
-- 공개 사이트 메뉴 관리 (대메뉴 · 그룹 · 소메뉴)
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 대메뉴 (환영합니다, 소개합니다, ...)
create table if not exists public.public_menus (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  href        text not null default '/',
  description text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- 소메뉴 그룹 (대메뉴 아래 카테고리)
create table if not exists public.public_menu_groups (
  id          uuid primary key default gen_random_uuid(),
  menu_id     uuid references public.public_menus on delete cascade not null,
  title       text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- 소메뉴 링크 (그룹 내 개별 링크)
create table if not exists public.public_menu_items (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references public.public_menu_groups on delete cascade not null,
  label       text not null,
  href        text not null default '/',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- RLS
alter table public.public_menus       enable row level security;
alter table public.public_menu_groups enable row level security;
alter table public.public_menu_items  enable row level security;

-- 누구나 읽기 (공개 메뉴)
create policy "menus_select_all"
  on public.public_menus for select using (true);

create policy "groups_select_all"
  on public.public_menu_groups for select using (true);

create policy "items_select_all"
  on public.public_menu_items for select using (true);

-- 관리자만 쓰기
create policy "menus_admin_all"
  on public.public_menus for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "groups_admin_all"
  on public.public_menu_groups for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "items_admin_all"
  on public.public_menu_items for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 시드: 기존 하드코딩 메뉴 구조
insert into public.public_menus (id, label, href, description, sort_order)
values
  ('a0000001-0001-4000-8000-000000000001', '환영합니다', '/welcome', '다애교회에 처음 오신 분들을 위한 안내입니다.', 1),
  ('a0000001-0001-4000-8000-000000000002', '소개합니다', '/about', '다애교회의 역사와 비전, 섬기는 사람들을 소개합니다.', 2),
  ('a0000001-0001-4000-8000-000000000003', '예배와 말씀', '/worship', '다애교회의 예배와 말씀을 안내합니다.', 3),
  ('a0000001-0001-4000-8000-000000000004', '공동체와 양육', '/community-info', '함께 성장하는 다애교회의 공동체와 양육 프로그램입니다.', 4),
  ('a0000001-0001-4000-8000-000000000005', '선교와 사역', '/mission', '다애교회의 선교 활동과 다양한 사역을 소개합니다.', 5)
on conflict (id) do nothing;

insert into public.public_menu_groups (id, menu_id, title, sort_order)
values
  ('b0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000001', '새가족 안내', 1),
  ('b0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000001', '방문 안내', 2),
  ('b0000001-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000002', '교회 소개', 1),
  ('b0000001-0001-4000-8000-000000000004', 'a0000001-0001-4000-8000-000000000002', '섬기는 사람들', 2),
  ('b0000001-0001-4000-8000-000000000005', 'a0000001-0001-4000-8000-000000000002', '교회 시설', 3),
  ('b0000001-0001-4000-8000-000000000006', 'a0000001-0001-4000-8000-000000000003', '예배 안내', 1),
  ('b0000001-0001-4000-8000-000000000007', 'a0000001-0001-4000-8000-000000000003', '설교', 2),
  ('b0000001-0001-4000-8000-000000000008', 'a0000001-0001-4000-8000-000000000004', '공동체', 1),
  ('b0000001-0001-4000-8000-000000000009', 'a0000001-0001-4000-8000-000000000004', '소모임', 2),
  ('b0000001-0001-4000-8000-00000000000a', 'a0000001-0001-4000-8000-000000000004', '양육 체계', 3),
  ('b0000001-0001-4000-8000-00000000000b', 'a0000001-0001-4000-8000-000000000005', '선교', 1),
  ('b0000001-0001-4000-8000-00000000000c', 'a0000001-0001-4000-8000-000000000005', '사회 봉사', 2),
  ('b0000001-0001-4000-8000-00000000000d', 'a0000001-0001-4000-8000-000000000005', '행정', 3)
on conflict (id) do nothing;

-- 소메뉴 아이템 (group_id, label, href, sort_order)
insert into public.public_menu_items (group_id, label, href, sort_order)
values
  ('b0000001-0001-4000-8000-000000000001', '환영 인사', '/welcome', 1),
  ('b0000001-0001-4000-8000-000000000001', '새가족 등록', '/welcome/register', 2),
  ('b0000001-0001-4000-8000-000000000001', '새가족 교육', '/welcome/education', 3),
  ('b0000001-0001-4000-8000-000000000002', '오시는 길', '/welcome/directions', 1),
  ('b0000001-0001-4000-8000-000000000002', '예배 안내', '/welcome/services', 2),
  ('b0000001-0001-4000-8000-000000000002', '자주 묻는 질문', '/welcome/faq', 3),
  ('b0000001-0001-4000-8000-000000000003', '담임목사 인사말', '/about', 1),
  ('b0000001-0001-4000-8000-000000000003', '교회 비전', '/about/vision', 2),
  ('b0000001-0001-4000-8000-000000000003', '교회 연혁', '/about/history', 3),
  ('b0000001-0001-4000-8000-000000000004', '담당목사', '/about/pastors', 1),
  ('b0000001-0001-4000-8000-000000000004', '장로/권사', '/about/elders', 2),
  ('b0000001-0001-4000-8000-000000000004', '교역자', '/about/staff', 3),
  ('b0000001-0001-4000-8000-000000000005', '시설 안내', '/about/facilities', 1),
  ('b0000001-0001-4000-8000-000000000005', '약도/주차', '/welcome/directions', 2),
  ('b0000001-0001-4000-8000-000000000006', '주일 예배', '/worship', 1),
  ('b0000001-0001-4000-8000-000000000006', '수요 예배', '/worship/wednesday', 2),
  ('b0000001-0001-4000-8000-000000000006', '금요 기도회', '/worship/friday', 3),
  ('b0000001-0001-4000-8000-000000000006', '새벽 기도회', '/worship/dawn', 4),
  ('b0000001-0001-4000-8000-000000000007', '주일 설교', '/worship/sermons', 1),
  ('b0000001-0001-4000-8000-000000000007', '특별 집회', '/worship/special', 2),
  ('b0000001-0001-4000-8000-000000000008', '청년부', '/community-info/young-adults', 1),
  ('b0000001-0001-4000-8000-000000000008', '청소년부', '/community-info/youth', 2),
  ('b0000001-0001-4000-8000-000000000008', '유초등부', '/community-info/children', 3),
  ('b0000001-0001-4000-8000-000000000008', '영유아부', '/community-info/nursery', 4),
  ('b0000001-0001-4000-8000-000000000009', '셀 모임', '/community-info/cell', 1),
  ('b0000001-0001-4000-8000-000000000009', '성경공부', '/community-info/bible-study', 2),
  ('b0000001-0001-4000-8000-000000000009', '기도 모임', '/community-info/prayer', 3),
  ('b0000001-0001-4000-8000-00000000000a', '양육 프로그램', '/community-info/nurture', 1),
  ('b0000001-0001-4000-8000-00000000000a', '제자 훈련', '/community-info/discipleship', 2),
  ('b0000001-0001-4000-8000-00000000000b', '선교 비전', '/mission', 1),
  ('b0000001-0001-4000-8000-00000000000b', '해외 선교', '/mission/overseas', 2),
  ('b0000001-0001-4000-8000-00000000000b', '국내 선교', '/mission/domestic', 3),
  ('b0000001-0001-4000-8000-00000000000c', '봉사 활동', '/mission/volunteer', 1),
  ('b0000001-0001-4000-8000-00000000000c', '구제 사역', '/mission/relief', 2),
  ('b0000001-0001-4000-8000-00000000000d', '헌금 안내', '/mission/offering', 1),
  ('b0000001-0001-4000-8000-00000000000d', '행정부서 안내', '/mission/admin', 2);
