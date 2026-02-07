-- ============================================================
-- 출석체크 및 보고 시스템 — 스키마
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. organizations (조직: 소그룹/부서/예배)
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null default 'small_group'
                check (type in ('small_group', 'department', 'worship')),
  parent_id   uuid references public.organizations on delete set null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

-- 2. org_leaders (조직 ↔ 리더/교역자)
create table if not exists public.org_leaders (
  organization_id uuid references public.organizations on delete cascade,
  user_id         uuid references auth.users on delete cascade,
  role            text not null default 'leader'
                    check (role in ('pastor', 'leader')),
  primary key (organization_id, user_id)
);

-- 3. roster_members (명단 — 앱 회원과 독립)
create table if not exists public.roster_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations on delete cascade not null,
  name            text not null,
  phone           text,
  status          text not null default 'active'
                    check (status in ('active', 'inactive', 'new')),
  memo            text,
  created_at      timestamptz not null default now()
);

-- 4. meetings (모임)
create table if not exists public.meetings (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations on delete cascade not null,
  meeting_date    date not null default current_date,
  title           text not null default '',
  created_by      uuid references auth.users on delete set null,
  created_at      timestamptz not null default now()
);

-- 5. attendance (출석)
create table if not exists public.attendance (
  meeting_id       uuid references public.meetings on delete cascade,
  roster_member_id uuid references public.roster_members on delete cascade,
  status           text not null default 'present'
                     check (status in ('present', 'absent', 'excused')),
  note             text,
  primary key (meeting_id, roster_member_id)
);

-- 6. meeting_reports (모임 보고서)
create table if not exists public.meeting_reports (
  id               uuid primary key default gen_random_uuid(),
  meeting_id       uuid references public.meetings on delete cascade not null unique,
  content          text not null default '',
  new_visitors     integer not null default 0,
  returning_count  integer not null default 0,
  prayer_requests  text not null default '',
  created_at       timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.organizations   enable row level security;
alter table public.org_leaders     enable row level security;
alter table public.roster_members  enable row level security;
alter table public.meetings        enable row level security;
alter table public.attendance      enable row level security;
alter table public.meeting_reports enable row level security;

-- ── organizations: 인증 사용자 읽기, admin만 쓰기 ──
create policy "orgs_select_authenticated"
  on public.organizations for select
  to authenticated using (true);

create policy "orgs_insert_admin"
  on public.organizations for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "orgs_update_admin"
  on public.organizations for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "orgs_delete_admin"
  on public.organizations for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── org_leaders: 인증 사용자 읽기, admin만 쓰기 ──
create policy "org_leaders_select_authenticated"
  on public.org_leaders for select
  to authenticated using (true);

create policy "org_leaders_insert_admin"
  on public.org_leaders for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "org_leaders_delete_admin"
  on public.org_leaders for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── roster_members: 해당 조직 리더만 CRUD ──
create policy "roster_select_leader"
  on public.roster_members for select
  to authenticated
  using (
    exists (
      select 1 from public.org_leaders
      where org_leaders.organization_id = roster_members.organization_id
        and org_leaders.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "roster_insert_leader"
  on public.roster_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.org_leaders
      where org_leaders.organization_id = roster_members.organization_id
        and org_leaders.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "roster_update_leader"
  on public.roster_members for update
  to authenticated
  using (
    exists (
      select 1 from public.org_leaders
      where org_leaders.organization_id = roster_members.organization_id
        and org_leaders.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "roster_delete_leader"
  on public.roster_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.org_leaders
      where org_leaders.organization_id = roster_members.organization_id
        and org_leaders.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── meetings: 해당 조직 리더만 CRUD ──
create policy "meetings_select_leader"
  on public.meetings for select
  to authenticated
  using (
    exists (
      select 1 from public.org_leaders
      where org_leaders.organization_id = meetings.organization_id
        and org_leaders.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "meetings_insert_leader"
  on public.meetings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.org_leaders
      where org_leaders.organization_id = meetings.organization_id
        and org_leaders.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "meetings_delete_leader"
  on public.meetings for delete
  to authenticated
  using (
    exists (
      select 1 from public.org_leaders
      where org_leaders.organization_id = meetings.organization_id
        and org_leaders.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── attendance: 해당 모임의 조직 리더만 CRUD ──
create policy "attendance_select_leader"
  on public.attendance for select
  to authenticated
  using (
    exists (
      select 1 from public.meetings m
      join public.org_leaders ol on ol.organization_id = m.organization_id
      where m.id = attendance.meeting_id
        and ol.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "attendance_insert_leader"
  on public.attendance for insert
  to authenticated
  with check (
    exists (
      select 1 from public.meetings m
      join public.org_leaders ol on ol.organization_id = m.organization_id
      where m.id = attendance.meeting_id
        and ol.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "attendance_update_leader"
  on public.attendance for update
  to authenticated
  using (
    exists (
      select 1 from public.meetings m
      join public.org_leaders ol on ol.organization_id = m.organization_id
      where m.id = attendance.meeting_id
        and ol.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "attendance_delete_leader"
  on public.attendance for delete
  to authenticated
  using (
    exists (
      select 1 from public.meetings m
      join public.org_leaders ol on ol.organization_id = m.organization_id
      where m.id = attendance.meeting_id
        and ol.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── meeting_reports: 해당 모임의 조직 리더만 CRUD ──
create policy "reports_select_leader"
  on public.meeting_reports for select
  to authenticated
  using (
    exists (
      select 1 from public.meetings m
      join public.org_leaders ol on ol.organization_id = m.organization_id
      where m.id = meeting_reports.meeting_id
        and ol.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "reports_insert_leader"
  on public.meeting_reports for insert
  to authenticated
  with check (
    exists (
      select 1 from public.meetings m
      join public.org_leaders ol on ol.organization_id = m.organization_id
      where m.id = meeting_reports.meeting_id
        and ol.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "reports_update_leader"
  on public.meeting_reports for update
  to authenticated
  using (
    exists (
      select 1 from public.meetings m
      join public.org_leaders ol on ol.organization_id = m.organization_id
      where m.id = meeting_reports.meeting_id
        and ol.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
