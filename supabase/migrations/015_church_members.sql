-- 성도명단 (이름만 관리)
CREATE TABLE church_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE church_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "church_members_select" ON church_members FOR SELECT USING (true);
CREATE POLICY "church_members_insert" ON church_members FOR INSERT WITH CHECK (true);
CREATE POLICY "church_members_update" ON church_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "church_members_delete" ON church_members FOR DELETE USING (true);
