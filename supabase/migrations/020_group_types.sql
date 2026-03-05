-- 그룹 타입 변경: ministry/group → dakobang/family/free
ALTER TABLE groups DROP CONSTRAINT groups_type_check;

UPDATE groups SET type = 'dakobang' WHERE type = 'group';
UPDATE groups SET type = 'free' WHERE type = 'ministry';

ALTER TABLE groups ADD CONSTRAINT groups_type_check CHECK (type IN ('dakobang', 'family', 'free'));
