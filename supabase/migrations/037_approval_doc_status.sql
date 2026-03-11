-- 결재 문서 상태: draft(임시저장), submitted(결재요청)
ALTER TABLE approval_posts ADD COLUMN IF NOT EXISTS doc_status text DEFAULT 'draft';
CREATE INDEX IF NOT EXISTS idx_approval_posts_doc_status ON approval_posts (doc_status);

-- 기존 게시글은 모두 결재요청 상태로
UPDATE approval_posts SET doc_status = 'submitted' WHERE doc_status IS NULL OR doc_status = 'draft';
