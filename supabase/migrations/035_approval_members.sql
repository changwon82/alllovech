-- 결재 시스템 멤버 (결재자/청구자 목록)
-- cafe24 g5_write_approval1_member 마이그레이션

CREATE TABLE IF NOT EXISTS approval_members (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  mb_id text NOT NULL,
  name text NOT NULL,
  position text,           -- 직분: 담임목사, 부목사, 장로, 권사, 안수집사, 전도사, 강도사, 집사, 청년
  status text DEFAULT '재직', -- 재직, 전출, 부재
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_approval_members_mb_id ON approval_members (mb_id);
CREATE INDEX idx_approval_members_status ON approval_members (status);

ALTER TABLE approval_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_members_read" ON approval_members FOR SELECT USING (true);
CREATE POLICY "approval_members_admin" ON approval_members FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- 데이터 삽입
INSERT INTO approval_members (mb_id, name, position, status, sort_order) VALUES
('pastorlee', '이순근', '담임목사', '재직', 1),
('ohyeajesus', '최창원', '부목사', '재직', 2),
('sws323', '손우성', '부목사', '전출', 3),
('jks5473', '전기석', '장로', '재직', 10),
('hmryu', '유형모', '장로', '재직', 11),
('joobyung', '김주병', '장로', '재직', 12),
('leejjin', '이정진', '장로', '재직', 13),
('esilkroad', '이재섭', '장로', '재직', 14),
('bonhyung', '구본형', '장로', '재직', 15),
('chona777', '조홍제', '장로', '재직', 16),
('kakao_961208ca', '선명종', '장로', '재직', 17),
('byang1', '양백', '장로', '재직', 18),
('cha7476', '정관섭', '장로', '부재', 19),
('jaeho', '장재호', '장로', '전출', 20),
('xljang', '장정욱', '안수집사', '재직', 30),
('takapuna', '김성식', '안수집사', '재직', 31),
('CSON1', '손창영', '안수집사', '재직', 32),
('samshim79', '심형구', '안수집사', '재직', 33),
('onlytop81', '유종훈', '안수집사', '재직', 34),
('kakao_8abf08c0', '최원호', '안수집사', '재직', 35),
('kakao_9c92095a', '이상수', '안수집사', '재직', 36),
('kakao_95680929', '권만오', '안수집사', '재직', 37),
('tykim33', '김태영', '안수집사', '재직', 38),
('kakao_9ac409ac', '이정석', '안수집사', '재직', 39),
('xlhee67', '김희정', '권사', '재직', 50),
('anna1634', '공은영', '권사', '재직', 51),
('lkh34110', '이경화', '권사', '재직', 52),
('hari10', '김선희', '권사', '재직', 53),
('raimom1004', '박천자', '권사', '재직', 54),
('ninne', '김해경', '권사', '재직', 55),
('chunms0718', '전미선', '권사', '재직', 56),
('kakao_9bff09c0', '오주희', '권사', '재직', 57),
('gracejin07', '진태정', '권사', '재직', 58),
('junghye8777', '윤정혜', '권사', '전출', 59),
('ajlee', '이애진', '권사', '부재', 60),
('kakao_8427088e', '선빈', '강도사', '재직', 70),
('younjinn', '안연진', '전도사', '재직', 71),
('kakao_83e607d0', '김영균', '전도사', '재직', 72),
('kakao_9c800919', '권록경', '전도사', '전출', 73),
('neojiji', '김지지', '집사', '재직', 80),
('kakao_97cc0901', '이지영B', '집사', '재직', 81),
('davekee', '장기성', '집사', '재직', 82),
('kakao_8a580838', '최지훈', '청년', '재직', 90);
