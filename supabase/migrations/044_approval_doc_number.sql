-- 결재요청 시 부여되는 문서번호 컬럼 추가
ALTER TABLE approval_posts ADD COLUMN IF NOT EXISTS doc_number bigint;

-- 기존 submitted 문서에는 id를 문서번호로 설정
UPDATE approval_posts SET doc_number = id WHERE doc_status = 'submitted' AND doc_number IS NULL;
