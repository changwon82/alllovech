-- 교회소식 테이블
CREATE TABLE IF NOT EXISTS news_posts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  content text,
  post_date timestamptz NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 교회소식 첨부파일 테이블
CREATE TABLE IF NOT EXISTS news_files (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id bigint NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  original_name text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_news_posts_date ON news_posts (post_date DESC);
CREATE INDEX idx_news_files_post ON news_files (post_id);

-- RLS
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_posts_read" ON news_posts FOR SELECT USING (true);
CREATE POLICY "news_files_read" ON news_files FOR SELECT USING (true);

CREATE POLICY "news_posts_admin" ON news_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "news_files_admin" ON news_files FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- cafe24 교회소식 마이그레이션
INSERT INTO news_posts (id, title, content, post_date, hit_count, created_at)
OVERRIDING SYSTEM VALUE
SELECT
  wr_id,
  wr_subject,
  wr_content,
  wr_datetime,
  wr_hit,
  wr_datetime
FROM cafe24.qqqq_g5_write_news
WHERE wr_is_comment = 0
  AND wr_subject != ''
ORDER BY wr_datetime DESC;

-- 시퀀스 설정
SELECT setval(pg_get_serial_sequence('news_posts', 'id'), COALESCE((SELECT MAX(id) FROM news_posts), 0) + 1);

-- cafe24 첨부파일 마이그레이션
INSERT INTO news_files (post_id, file_name, original_name, sort_order)
SELECT
  wr_id,
  bf_file,
  bf_source,
  bf_no
FROM cafe24.qqqq_g5_board_file
WHERE bo_table = 'news'
  AND bf_file != '';
