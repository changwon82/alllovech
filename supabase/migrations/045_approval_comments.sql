-- 결재의견 테이블
CREATE TABLE IF NOT EXISTS approval_comments (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id bigint NOT NULL REFERENCES approval_posts(id) ON DELETE CASCADE,
  mb_id text NOT NULL,
  name text NOT NULL,
  step text NOT NULL, -- 'approver1', 'approver2', 'finance', 'payment'
  status text NOT NULL, -- '승인', '승인취소', '집행'
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_approval_comments_post ON approval_comments(post_id);

ALTER TABLE approval_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_comments_read" ON approval_comments FOR SELECT USING (true);
CREATE POLICY "approval_comments_insert" ON approval_comments FOR INSERT WITH CHECK (true);
