-- approval_members에 Supabase user_id 매핑 추가
-- 로그인한 사용자가 어떤 결재자인지 식별하기 위함
ALTER TABLE approval_members ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_approval_members_user_id ON approval_members (user_id);
