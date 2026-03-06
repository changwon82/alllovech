-- 함께읽기 그룹에 다코방장 이름 스냅샷 저장
ALTER TABLE groups
  ADD COLUMN dakobang_leaders TEXT[];

-- 기존 다코방 그룹에 현재 방장 이름 백필
UPDATE groups g
SET dakobang_leaders = sub.leaders
FROM (
  SELECT dgm.group_id, ARRAY_AGG(cm.name ORDER BY cm.name) AS leaders
  FROM dakobang_group_members dgm
  JOIN church_members cm ON cm.id = dgm.member_id
  WHERE dgm.role = 'leader'
  GROUP BY dgm.group_id
) sub
WHERE g.dakobang_group_id = sub.group_id
  AND g.dakobang_group_id IS NOT NULL;
