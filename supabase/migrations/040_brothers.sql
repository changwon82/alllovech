-- 교우소식 (brothers) 테이블
CREATE TABLE IF NOT EXISTS brothers_posts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  content text,
  post_date timestamptz NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brothers_posts_date ON brothers_posts (post_date DESC);

-- RLS
ALTER TABLE brothers_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brothers_posts_select" ON brothers_posts
  FOR SELECT USING (true);

CREATE POLICY "brothers_posts_admin_insert" ON brothers_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "brothers_posts_admin_update" ON brothers_posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "brothers_posts_admin_delete" ON brothers_posts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
  );
