-- 함께읽기 셀프 개설: 프리셋 제거 + groups 테이블 확장

-- 1. groups 테이블에 새 컬럼 추가
ALTER TABLE groups
  ADD COLUMN content_type TEXT NOT NULL DEFAULT '365bible',
  ADD COLUMN start_date DATE,
  ADD COLUMN end_date DATE,
  ADD COLUMN dakobang_group_id UUID REFERENCES dakobang_groups(id),
  ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN created_by UUID REFERENCES profiles(id);

-- 2. 기존 프리셋 데이터 → groups로 이관
UPDATE groups g
SET
  dakobang_group_id = bgp.dakobang_group_id,
  start_date = bgp.start_date,
  end_date = bgp.end_date
FROM bible_group_preset_groups bpg
JOIN bible_group_presets bgp ON bgp.id = bpg.preset_id
WHERE g.id = bpg.group_id;

-- 3. 프리셋 테이블 삭제
DROP TABLE IF EXISTS bible_group_preset_groups;
DROP TABLE IF EXISTS bible_group_presets;

-- 4. 다코방 연도별 중복 방지 인덱스
CREATE UNIQUE INDEX idx_groups_dakobang_year
  ON groups (dakobang_group_id, EXTRACT(YEAR FROM start_date))
  WHERE dakobang_group_id IS NOT NULL AND status != 'rejected';
