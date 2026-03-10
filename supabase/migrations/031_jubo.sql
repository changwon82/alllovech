-- 주보 테이블
CREATE TABLE IF NOT EXISTS jubo_posts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  content text,
  post_date timestamptz NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 주보 이미지 테이블
CREATE TABLE IF NOT EXISTS jubo_images (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id bigint NOT NULL REFERENCES jubo_posts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  original_name text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_jubo_posts_date ON jubo_posts (post_date DESC);
CREATE INDEX idx_jubo_images_post ON jubo_images (post_id);

-- RLS
ALTER TABLE jubo_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jubo_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jubo_posts_read" ON jubo_posts FOR SELECT USING (true);
CREATE POLICY "jubo_images_read" ON jubo_images FOR SELECT USING (true);

CREATE POLICY "jubo_posts_admin" ON jubo_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "jubo_images_admin" ON jubo_images FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- cafe24 주보 게시글 마이그레이션
INSERT INTO jubo_posts (id, title, content, post_date, hit_count, created_at)
OVERRIDING SYSTEM VALUE
SELECT
  wr_id,
  wr_subject,
  wr_content,
  wr_datetime,
  wr_hit,
  wr_datetime
FROM cafe24.qqqq_g5_write_jubo
WHERE wr_is_comment = 0
  AND wr_subject != ''
ORDER BY wr_datetime DESC;

-- 시퀀스 설정
SELECT setval(pg_get_serial_sequence('jubo_posts', 'id'), COALESCE((SELECT MAX(id) FROM jubo_posts), 0) + 1);

-- cafe24 첨부파일 마이그레이션
INSERT INTO jubo_images (post_id, file_name, original_name, sort_order)
SELECT
  wr_id,
  bf_file,
  bf_source,
  bf_no
FROM cafe24.qqqq_g5_board_file
WHERE bo_table = 'jubo'
  AND bf_file != '';
