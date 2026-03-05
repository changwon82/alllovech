-- 대댓글(리댓글) 지원: parent_id 추가
ALTER TABLE reflection_comments
  ADD COLUMN parent_id uuid REFERENCES reflection_comments(id) ON DELETE CASCADE;

CREATE INDEX idx_reflection_comments_parent ON reflection_comments(parent_id);
