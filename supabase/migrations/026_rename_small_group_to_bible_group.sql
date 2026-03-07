-- groups type CHECK 정리: 실제 사용 중인 타입으로 재설정
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_type_check;
ALTER TABLE groups ADD CONSTRAINT groups_type_check
  CHECK (type IN ('dakobang', 'family', 'free', 'district', 'department', 'edu_class', 'one_on_one'));
ALTER TABLE groups ALTER COLUMN type SET DEFAULT 'dakobang';
