-- cafe24 원본 wr_8 (계정이름)에서 올바른 값으로 account_name 업데이트
-- 기존 account_name에 참조부서(wr_11) 값이 잘못 들어가 있었음

-- 1. 먼저 현재 잘못된 account_name 값을 ref_department로 백업 (아직 비어있는 경우만)
UPDATE approval_posts p
SET ref_department = p.account_name
WHERE p.account_name IS NOT NULL
  AND (p.ref_department IS NULL OR p.ref_department = '');

-- 2. cafe24 원본 wr_8에서 올바른 계정이름으로 덮어쓰기
UPDATE approval_posts p
SET account_name = NULLIF(TRIM(c.wr_8), '')
FROM cafe24.qqqq_g5_write_approval1 c
WHERE p.id = c.wr_id
  AND c.wr_is_comment = 0;

-- 3. wr_11 (참조부서) 원본 값도 ref_department에 올바르게 저장
UPDATE approval_posts p
SET ref_department = NULLIF(TRIM(c.wr_11), '')
FROM cafe24.qqqq_g5_write_approval1 c
WHERE p.id = c.wr_id
  AND c.wr_is_comment = 0
  AND c.wr_11 IS NOT NULL
  AND TRIM(c.wr_11) != '';

-- 4. wr_1 (참조인원) 원본 값도 ref_members에 저장
UPDATE approval_posts p
SET ref_members = NULLIF(TRIM(c.wr_1), '')
FROM cafe24.qqqq_g5_write_approval1 c
WHERE p.id = c.wr_id
  AND c.wr_is_comment = 0
  AND c.wr_1 IS NOT NULL
  AND TRIM(c.wr_1) != '';

-- 5. wr_14 (문서분류)가 누락된 레코드 보정
UPDATE approval_posts p
SET doc_category = NULLIF(TRIM(c.wr_14), '')
FROM cafe24.qqqq_g5_write_approval1 c
WHERE p.id = c.wr_id
  AND c.wr_is_comment = 0
  AND (p.doc_category IS NULL OR p.doc_category = '')
  AND c.wr_14 IS NOT NULL
  AND TRIM(c.wr_14) != '';
