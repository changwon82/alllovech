-- 다코방 조직 관리 테이블
CREATE TABLE dakobang_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_team TEXT DEFAULT '',
  name        TEXT NOT NULL DEFAULT '',
  leaders     TEXT DEFAULT '',
  sub_leaders TEXT DEFAULT '',
  members     TEXT DEFAULT '',
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: service role (admin 클라이언트)로만 접근
ALTER TABLE dakobang_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dakobang_groups_select" ON dakobang_groups FOR SELECT USING (true);
CREATE POLICY "dakobang_groups_insert" ON dakobang_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "dakobang_groups_update" ON dakobang_groups FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "dakobang_groups_delete" ON dakobang_groups FOR DELETE USING (true);

-- 초기 데이터 (2025 다코방 조직 as of 2025.09.08)
INSERT INTO dakobang_groups (ministry_team, name, leaders, sub_leaders, members, sort_order) VALUES
  ('김주병', '디딤돌 다코방', '김주병/소미선', '조두옥/김순진', '장현일/민경미, 안선녀, 박흥균/오지은', 1),
  ('김주병', '디아스포라 다코방', '전기석/이문희', '최경화', '최경현/이미정, 박혜순, 남동숙은, 신현아/이진현, 김영8명', 2),
  ('김주병', '거울 다코방', '이미옥', '', '은정근, 오성자, 김숙영', 3),
  ('김주병', '그레이스 라운지 다코방', '이이지영', '장호선/채랜진', '김행안/이미자, 강설아/서빈진, 야순련란, 김세형/이미자, 김영/강현영', 4),
  ('김주병', '그레이스 라운지 다코방', '이정석/안희숙', '김주연/궤세이', '이영인/조영신, 최지은, 박성임/정혜순, 박금, 김기혜/손민이', 5),
  ('김주병', '그레이스 라운지 다코방', '심형구/이배아', '이소연/류은정', '심미현에/이시혜, 김영아/신덕김, 박만서/김정혜, 최현/임혜숙', 6),
  ('김주병', '', '', '', '김기연/세은이', 7),
  ('전미선/공은영', '강당 다코방', '', '', '', 8),
  ('전미선/공은영', '은혜방', '이규은/안선이/이규은', '', '오현이/이의이, 오현천/이의인, 하현수/이순희, 최현이/이숙현', 9),
  ('전미선/공은영', '마중물 다코방', '박계순', '', '김선아, 이을리, 노을리, 이선희, 조숙이', 10),
  ('전미선/공은영', '온유한 다코방', '조수미', '', '최서윤, 박경화/송해선, 유혜은, 장숙영/이숙현', 11),
  ('전미선/공은영', '글로벌 다코방', '박혜은', '조영화', '박원생/금은선, 등영화, 최현이/이숙현', 12),
  ('유형호/김해경', '주반바라기', '박혜교/이순미', '', '김해옥/최미경, 김윤신/대혜정, 박성서/송명이, 오주은, 김이진', 13),
  ('유형호/김해경', '다해수라방', '김선입/김선미', '', '조정환, 박지현, 박선인, 정혜숙, 박선미', 14),
  ('유형호/김해경', '한 다코방', '김재건/공혜숙', '김지녀', '이선우, 장숙자, 박선인, 정혜숙, 박선미', 15),
  ('유형호/김해경', '베리트 다코방', '신영준/노윤정', '최성석', '김나라, 김선희, 최해경, 이미혜, 박선미', 16),
  ('유형호/김해경', '토브방', '조용새시은경', '', '진용환/이미자, 박진희/최미화, 니교현, 이영미/박인현', 17),
  ('유형호/김해경', '온유방', '황수연', '', '오숙영, 이미경', 18),
  ('이정진', '', '이여수/도은공', '', '박정숙/여명혜, 김영신/서이, 김의원/한디, 이리미, 박현리/이선진, 이경자, 김대봉', 19),
  ('이정진', '', '오정현/김선영', '박영아/김경임', '김행예/서순이, 김혜월/베인디, 오혜진, 이경환/김금단, 이경환', 20),
  ('이정진', '신흥부방', '민정규/김순희', '이송미', '안선이/이인미, 장기영/심선미, 조혜경, 이순우/지이이', 21),
  ('최정원', '오엘나무 다코방', '', '', '김혜진, 김유진, 서수은, 세이미, 최보경, 강보선, 송예비, 이이아', 22),
  ('김희란', '', '', '', '김정미, 오정숙', 23);
