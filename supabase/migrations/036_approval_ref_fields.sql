-- 결재 문서에 참조부서, 참조인원 필드 추가
ALTER TABLE approval_posts ADD COLUMN IF NOT EXISTS ref_department text;
ALTER TABLE approval_posts ADD COLUMN IF NOT EXISTS ref_members text;
