-- 결재 청구서 테이블
CREATE TABLE IF NOT EXISTS approval_posts (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  content text,
  author_name text,
  author_mb_id text,
  post_date timestamptz NOT NULL,
  hit_count integer DEFAULT 0,
  -- 결재 흐름
  requester_mb_id text,           -- wr_2: 청구자
  approver1_mb_id text,           -- wr_4: 1차결재자
  approver1_status text,          -- wr_3: "0|0" 또는 "1|날짜"
  approver2_mb_id text,           -- wr_6: 최종결재자
  approver2_status text,          -- wr_5: "0|0" 또는 "1|날짜"
  finance_status text,            -- wr_7: 지급결재 상태
  payment_status text,            -- wr_9: 지급 상태 ("4|날짜" = 지급완료)
  amount integer DEFAULT 0,       -- wr_10: 금액
  created_at timestamptz DEFAULT now()
);

-- 결재 첨부파일
CREATE TABLE IF NOT EXISTS approval_files (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id bigint NOT NULL REFERENCES approval_posts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  original_name text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 결재 세부항목 (품의서 내역)
CREATE TABLE IF NOT EXISTS approval_items (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id bigint NOT NULL REFERENCES approval_posts(id) ON DELETE CASCADE,
  item_name text,
  standard text,
  quantity integer DEFAULT 1,
  unit_price integer DEFAULT 0,
  total_price integer DEFAULT 0,
  note text,
  created_at timestamptz DEFAULT now()
);

-- 예산 테이블
CREATE TABLE IF NOT EXISTS approval_budgets (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  year text NOT NULL,
  bg_code text,
  committee text,
  account text,
  budget integer DEFAULT 0,
  spending integer DEFAULT 0,
  balance integer DEFAULT 0,
  purpose text,
  chairman text,
  manager text
);

-- 인덱스
CREATE INDEX idx_approval_posts_date ON approval_posts (post_date DESC);
CREATE INDEX idx_approval_files_post ON approval_files (post_id);
CREATE INDEX idx_approval_items_post ON approval_items (post_id);
CREATE INDEX idx_approval_budgets_year ON approval_budgets (year);

-- RLS
ALTER TABLE approval_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_posts_read" ON approval_posts FOR SELECT USING (true);
CREATE POLICY "approval_files_read" ON approval_files FOR SELECT USING (true);
CREATE POLICY "approval_items_read" ON approval_items FOR SELECT USING (true);
CREATE POLICY "approval_budgets_read" ON approval_budgets FOR SELECT USING (true);

CREATE POLICY "approval_posts_admin" ON approval_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "approval_files_admin" ON approval_files FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "approval_items_admin" ON approval_items FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "approval_budgets_admin" ON approval_budgets FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- cafe24 결재 게시글 마이그레이션
INSERT INTO approval_posts (id, title, content, author_name, author_mb_id, post_date, hit_count,
  requester_mb_id, approver1_mb_id, approver1_status, approver2_mb_id, approver2_status,
  finance_status, payment_status, amount, created_at)
OVERRIDING SYSTEM VALUE
SELECT
  wr_id,
  wr_subject,
  wr_content,
  wr_name,
  mb_id,
  wr_datetime,
  wr_hit,
  wr_2,   -- 청구자
  wr_4,   -- 1차결재자
  wr_3,   -- 1차결재 상태
  wr_6,   -- 최종결재자
  wr_5,   -- 최종결재 상태
  wr_7,   -- 지급결재
  wr_9,   -- 지급상태
  CASE WHEN wr_10 ~ '^\d+$' THEN wr_10::integer ELSE 0 END,
  wr_datetime
FROM cafe24.qqqq_g5_write_approval1
WHERE wr_is_comment = 0
  AND wr_subject != ''
ORDER BY wr_datetime DESC;

-- 시퀀스 설정
SELECT setval(pg_get_serial_sequence('approval_posts', 'id'), COALESCE((SELECT MAX(id) FROM approval_posts), 0) + 1);

-- 첨부파일 마이그레이션
INSERT INTO approval_files (post_id, file_name, original_name, sort_order)
SELECT
  wr_id,
  bf_file,
  bf_source,
  bf_no
FROM cafe24.qqqq_g5_board_file
WHERE bo_table = 'approval1'
  AND bf_file != '';

-- 세부항목 마이그레이션
INSERT INTO approval_items (post_id, item_name, standard, quantity, unit_price, total_price, note)
SELECT
  wr_id,
  doc_sub,
  doc_standard,
  doc_cnt,
  doc_unit,
  doc_cost,
  doc_etc
FROM cafe24.qqqq_g5_write_approval1_sub;

-- 예산 마이그레이션
INSERT INTO approval_budgets (year, bg_code, committee, account, budget, spending, balance, purpose, chairman, manager)
SELECT
  year,
  bg_code,
  committee,
  account,
  budget,
  spending,
  balance,
  purpose,
  chairman,
  manager
FROM cafe24.qqqq_g5_write_approval1_budget;
