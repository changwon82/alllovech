-- bible_managers 테이블 생성 (365성경읽기 매니저 — 전체 그룹 현황 조회 권한)
CREATE TABLE IF NOT EXISTS bible_managers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bible_managers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY bible_managers_select_own ON bible_managers
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- groups.type CHECK 복구
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_type_check;
ALTER TABLE groups ADD CONSTRAINT groups_type_check
  CHECK (type IN ('dakobang', 'family', 'free', 'district', 'department', 'edu_class', 'one_on_one'));
ALTER TABLE groups ALTER COLUMN type SET DEFAULT 'dakobang';
