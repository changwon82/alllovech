-- 교인 추가 정보 컬럼
ALTER TABLE church_members
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS birth_date TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;
