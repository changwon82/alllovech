-- 다코방 조직 ↔ 성도명단 관계형 연결
CREATE TABLE dakobang_group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES dakobang_groups(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES church_members(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('ministry_team','leader','sub_leader','member')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, member_id, role)
);

ALTER TABLE dakobang_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dgm_select" ON dakobang_group_members FOR SELECT USING (true);
CREATE POLICY "dgm_insert" ON dakobang_group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "dgm_update" ON dakobang_group_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "dgm_delete" ON dakobang_group_members FOR DELETE USING (true);

CREATE INDEX idx_dgm_group_role ON dakobang_group_members (group_id, role);
CREATE INDEX idx_dgm_member ON dakobang_group_members (member_id);
