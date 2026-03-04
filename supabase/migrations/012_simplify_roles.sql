-- ============================================================
-- 역할 시스템 단순화
-- user_roles: ADMIN, MEMBER 만 허용
-- group_members: leader, member 만 허용
-- ============================================================

-- ======================== 1. 데이터 마이그레이션 ========================

-- PASTOR/STAFF → ADMIN (이미 ADMIN 행이 있으면 무시)
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'ADMIN' FROM user_roles WHERE role IN ('PASTOR', 'STAFF')
ON CONFLICT (user_id, role) DO NOTHING;

-- 변환 완료된 PASTOR/STAFF + 불필요 역할 삭제
DELETE FROM user_roles WHERE role NOT IN ('ADMIN', 'MEMBER');

-- sub_leader → leader (이미 leader 행이 있으면 무시)
INSERT INTO group_members (group_id, user_id, role, joined_at)
SELECT group_id, user_id, 'leader', joined_at FROM group_members WHERE role = 'sub_leader'
ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'leader';

-- teacher/deacon → member (이미 member 행이 있으면 무시)
INSERT INTO group_members (group_id, user_id, role, joined_at)
SELECT group_id, user_id, 'member', joined_at FROM group_members WHERE role IN ('teacher', 'deacon')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 변환 완료된 불필요 역할 삭제 (이미 upsert로 변환됨)
DELETE FROM group_members WHERE role NOT IN ('leader', 'member');

-- ======================== 2. CHECK 제약 변경 ========================

-- user_roles: 기존 CHECK 제거 후 새로 추가
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('ADMIN', 'MEMBER'));

-- group_members: 기존 CHECK 제거 후 새로 추가
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_role_check;
ALTER TABLE group_members ADD CONSTRAINT group_members_role_check CHECK (role IN ('leader', 'member'));

-- ======================== 3. RLS 정책 업데이트 ========================

-- bible_checks: ADMIN/PASTOR/STAFF → ADMIN
DROP POLICY IF EXISTS "checks_select_leaders" ON bible_checks;
CREATE POLICY "checks_select_leaders"
  ON bible_checks FOR SELECT
  USING (public.has_role('ADMIN'));

-- reflections: ADMIN/PASTOR → ADMIN
DROP POLICY IF EXISTS "reflections_select_leaders" ON reflections;
CREATE POLICY "reflections_select_leaders"
  ON reflections FOR SELECT
  USING (public.has_role('ADMIN'));

-- group_invites: leader/sub_leader → leader
DROP POLICY IF EXISTS "invites_select_leader" ON group_invites;
CREATE POLICY "invites_select_leader" ON group_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invites.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'leader'
    )
  );

DROP POLICY IF EXISTS "invites_select_admin" ON group_invites;
CREATE POLICY "invites_select_admin" ON group_invites FOR SELECT
  USING (public.has_role('ADMIN'));

DROP POLICY IF EXISTS "invites_insert_leader" ON group_invites;
CREATE POLICY "invites_insert_leader" ON group_invites FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invites.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'leader'
    )
  );

DROP POLICY IF EXISTS "invites_update_leader" ON group_invites;
CREATE POLICY "invites_update_leader" ON group_invites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invites.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'leader'
    )
  );

DROP POLICY IF EXISTS "invites_update_admin" ON group_invites;
CREATE POLICY "invites_update_admin" ON group_invites FOR UPDATE
  USING (public.has_role('ADMIN'));
