-- 갤러리 게시글 테이블
CREATE TABLE IF NOT EXISTS gallery_posts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  category text NOT NULL,        -- 예배, 기타, 교회학교, 행사, 건축
  content text,                  -- HTML 콘텐츠 (이전 이미지 포함)
  post_date timestamptz NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 갤러리 첨부 이미지 테이블
CREATE TABLE IF NOT EXISTS gallery_images (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id bigint NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
  file_name text NOT NULL,        -- R2에 저장된 파일명
  original_name text,             -- 원본 파일명
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_gallery_posts_date ON gallery_posts (post_date DESC);
CREATE INDEX idx_gallery_posts_category ON gallery_posts (category);
CREATE INDEX idx_gallery_images_post ON gallery_images (post_id);

-- RLS
ALTER TABLE gallery_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_posts_read" ON gallery_posts FOR SELECT USING (true);
CREATE POLICY "gallery_images_read" ON gallery_images FOR SELECT USING (true);

CREATE POLICY "gallery_posts_admin" ON gallery_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "gallery_images_admin" ON gallery_images FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- cafe24 갤러리 게시글 마이그레이션
INSERT INTO gallery_posts (id, title, category, content, post_date, hit_count, created_at)
OVERRIDING SYSTEM VALUE
SELECT
  wr_id,
  wr_subject,
  ca_name,
  wr_content,
  wr_datetime,
  wr_hit,
  wr_datetime
FROM cafe24.qqqq_g5_write_gallery
WHERE wr_is_comment = 0
  AND wr_subject != ''
ORDER BY wr_datetime DESC;

-- 시퀀스를 마지막 ID 이후로 설정
SELECT setval(pg_get_serial_sequence('gallery_posts', 'id'), COALESCE((SELECT MAX(id) FROM gallery_posts), 0) + 1);

-- cafe24 첨부파일 마이그레이션
INSERT INTO gallery_images (post_id, file_name, original_name, sort_order)
SELECT
  wr_id,
  bf_file,
  bf_source,
  bf_no
FROM cafe24.qqqq_g5_board_file
WHERE bo_table = 'gallery'
  AND bf_file != '';
