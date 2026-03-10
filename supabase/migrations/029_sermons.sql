-- 설교 테이블 (cafe24 데이터 마이그레이션용)
CREATE TABLE IF NOT EXISTS sermons (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  preacher text NOT NULL,
  sermon_date date NOT NULL,
  scripture text,              -- 성경 본문 (창세기 3장 7, 21절)
  category text NOT NULL,      -- 주일예배, 수요여성예배, 새벽기도회 등
  youtube_url text,            -- 유튜브 embed URL
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_sermons_date ON sermons (sermon_date DESC);
CREATE INDEX idx_sermons_category ON sermons (category);

-- RLS
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "sermons_read" ON sermons
  FOR SELECT USING (true);

-- 관리자만 수정 가능
CREATE POLICY "sermons_admin_write" ON sermons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
  );

-- cafe24 데이터 마이그레이션
-- wr_2 날짜 형식: '2024-01-01', '2014-02-21 16:51:34', '2019년 7월 7일', '', '.', ' '
INSERT INTO sermons (title, preacher, sermon_date, scripture, category, youtube_url, hit_count, created_at)
SELECT
  wr_subject,
  wr_1,
  CASE
    -- '2019년 7월 7일' 형식
    WHEN wr_2 ~ '^\d{4}년' THEN
      to_date(
        regexp_replace(wr_2, '(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일', '\1-\2-\3'),
        'YYYY-MM-DD'
      )
    -- '2024-01-01' 또는 '2014-02-21 16:51:34' 형식
    WHEN wr_2 ~ '^\d{4}-\d{2}-\d{2}' THEN
      wr_2::date
    -- 그 외 (빈값, '.', ' ') → wr_datetime 사용
    ELSE
      wr_datetime::date
  END,
  NULLIF(wr_3, ''),
  ca_name,
  NULLIF(wr_4, ''),
  wr_hit,
  wr_datetime
FROM cafe24.qqqq_g5_write_preachment
WHERE wr_is_comment = 0
  AND wr_subject != ''
ORDER BY qqqq_g5_write_preachment.wr_datetime DESC;
