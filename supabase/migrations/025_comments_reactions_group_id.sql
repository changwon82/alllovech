-- 댓글/리액션을 그룹별로 분리
-- 하나의 묵상이 여러 그룹에 공유될 때, 그룹별 독립 운영

-- 1. 컬럼 추가 (nullable)
ALTER TABLE reflection_comments
  ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE reflection_reactions
  ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- 2. 기존 데이터 backfill (reflection_group_shares로 group_id 매핑)
UPDATE reflection_comments rc
SET group_id = (
  SELECT rgs.group_id FROM reflection_group_shares rgs
  WHERE rgs.reflection_id = rc.reflection_id
  LIMIT 1
);
UPDATE reflection_reactions rr
SET group_id = (
  SELECT rgs.group_id FROM reflection_group_shares rgs
  WHERE rgs.reflection_id = rr.reflection_id
  LIMIT 1
);

-- group_id가 NULL인 고아 데이터 삭제
DELETE FROM reflection_comments WHERE group_id IS NULL;
DELETE FROM reflection_reactions WHERE group_id IS NULL;

-- 3. NOT NULL 제약
ALTER TABLE reflection_comments ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE reflection_reactions ALTER COLUMN group_id SET NOT NULL;

-- 4. reflection_reactions PK 변경 (user당 그룹별 1개 리액션)
ALTER TABLE reflection_reactions DROP CONSTRAINT reflection_reactions_pkey;
ALTER TABLE reflection_reactions ADD PRIMARY KEY (reflection_id, user_id, group_id);

-- 5. 인덱스
CREATE INDEX idx_reflection_comments_group ON reflection_comments(group_id);
CREATE INDEX idx_reflection_reactions_group ON reflection_reactions(group_id);
