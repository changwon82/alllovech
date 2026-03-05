-- reflection_reactions type 확장: 이모지 리액션 지원
ALTER TABLE reflection_reactions DROP CONSTRAINT IF EXISTS reflection_reactions_type_check;
ALTER TABLE reflection_reactions
  ADD CONSTRAINT reflection_reactions_type_check
  CHECK (type IN ('amen', 'heart', 'like', 'pray', 'fire', 'cry'));

-- 기존 amen → pray 변환
UPDATE reflection_reactions SET type = 'pray' WHERE type = 'amen';
