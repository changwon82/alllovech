-- 함께읽기 다코방 프리셋
CREATE TABLE bible_group_presets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dakobang_group_id UUID NOT NULL REFERENCES dakobang_groups(id) ON DELETE CASCADE,
  group_id          UUID REFERENCES groups(id) ON DELETE SET NULL,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dakobang_group_id)
);

ALTER TABLE bible_group_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bgp_select" ON bible_group_presets FOR SELECT USING (true);
CREATE POLICY "bgp_insert" ON bible_group_presets FOR INSERT WITH CHECK (true);
CREATE POLICY "bgp_update" ON bible_group_presets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "bgp_delete" ON bible_group_presets FOR DELETE USING (true);
