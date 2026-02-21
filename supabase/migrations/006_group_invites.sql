-- ============================================================
-- Phase 6: 그룹 초대 링크
-- ============================================================

CREATE TABLE group_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES groups ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  created_by  UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ,          -- NULL = 만료 없음
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_invites_code ON group_invites (code) WHERE is_active = TRUE;

ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- 그룹 리더/부리더만 자기 그룹 초대 조회
CREATE POLICY "invites_select_leader" ON group_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invites.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'sub_leader')
    )
  );

-- 관리자도 조회 가능
CREATE POLICY "invites_select_admin" ON group_invites FOR SELECT
  USING (public.has_any_role(ARRAY['ADMIN', 'PASTOR', 'STAFF']));

-- 그룹 리더/부리더만 초대 생성
CREATE POLICY "invites_insert_leader" ON group_invites FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invites.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'sub_leader')
    )
  );

-- 그룹 리더/부리더만 초대 비활성화
CREATE POLICY "invites_update_leader" ON group_invites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invites.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'sub_leader')
    )
  );

-- 관리자도 수정 가능
CREATE POLICY "invites_update_admin" ON group_invites FOR UPDATE
  USING (public.has_any_role(ARRAY['ADMIN', 'PASTOR', 'STAFF']));
