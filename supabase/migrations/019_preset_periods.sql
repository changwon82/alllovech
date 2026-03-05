-- 프리셋 기간 기반 재사용 구조
-- bible_group_preset_groups: 연도별 그룹 매핑
CREATE TABLE bible_group_preset_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id  UUID NOT NULL REFERENCES bible_group_presets(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기존 group_id 데이터 이관
INSERT INTO bible_group_preset_groups (preset_id, group_id)
SELECT id, group_id FROM bible_group_presets WHERE group_id IS NOT NULL;

-- start_date / end_date 추가
ALTER TABLE bible_group_presets ADD COLUMN start_date DATE NOT NULL DEFAULT '2026-01-01';
ALTER TABLE bible_group_presets ADD COLUMN end_date DATE NOT NULL DEFAULT '2030-12-31';

-- 기존 컬럼 제거
ALTER TABLE bible_group_presets DROP COLUMN group_id;
ALTER TABLE bible_group_presets DROP COLUMN is_active;

-- RLS
ALTER TABLE bible_group_preset_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpg_select" ON bible_group_preset_groups FOR SELECT USING (true);
CREATE POLICY "bpg_insert" ON bible_group_preset_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "bpg_delete" ON bible_group_preset_groups FOR DELETE USING (true);
