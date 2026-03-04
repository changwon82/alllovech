-- 그룹 type 단순화: 5개 → 2개 (ministry, group)
-- ministry = 최상위 사역, group = 하위 조직/모임

-- 1. 기존 CHECK 제약 제거
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_type_check;

-- 2. 데이터 변환
UPDATE groups SET type = 'ministry' WHERE parent_id IS NULL;
UPDATE groups SET type = 'group' WHERE parent_id IS NOT NULL;

-- 3. 새 CHECK 제약 추가
ALTER TABLE groups ADD CONSTRAINT groups_type_check CHECK (type IN ('ministry', 'group'));
