-- pages 테이블: 정적 페이지 콘텐츠를 DB에서 관리
CREATE TABLE IF NOT EXISTS pages (
  slug text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "pages_read" ON pages FOR SELECT USING (true);

-- 쓰기는 service role만 (서버 액션에서 admin 확인 후 사용)
-- RLS가 켜져 있지만 service role은 우회하므로 별도 write 정책 불필요
