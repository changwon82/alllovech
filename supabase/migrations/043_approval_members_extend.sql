-- approval_members 테이블 확장: cafe24 원본 필드 추가

-- mb_id NULL 허용 (조직 타입은 mb_id 없음)
ALTER TABLE approval_members ALTER COLUMN mb_id DROP NOT NULL;

-- 필드 추가
ALTER TABLE approval_members
  ADD COLUMN IF NOT EXISTS mb_section integer DEFAULT 0,   -- 구분: 1=예배,2=목양,3=재정,4=총무,5=선교,6=교육,7=설비,8=기획,0=기타
  ADD COLUMN IF NOT EXISTS mb_kind text,                   -- 부서명
  ADD COLUMN IF NOT EXISTS mb_birth text,                  -- 생년월일
  ADD COLUMN IF NOT EXISTS mb_email text,                  -- 이메일
  ADD COLUMN IF NOT EXISTS mb_hp text,                     -- 휴대전화
  ADD COLUMN IF NOT EXISTS mb_tel text,                    -- 일반전화
  ADD COLUMN IF NOT EXISTS mb_area text,                   -- 담당사역
  ADD COLUMN IF NOT EXISTS join_date text,                 -- 등록일
  ADD COLUMN IF NOT EXISTS retire_date text,               -- 삭제일(퇴직일)
  ADD COLUMN IF NOT EXISTS extra_dept text,                -- 추가부서 (콤마 구분)
  ADD COLUMN IF NOT EXISTS mb_addr1 text,                  -- 기본주소
  ADD COLUMN IF NOT EXISTS mb_addr2 text,                  -- 상세주소
  ADD COLUMN IF NOT EXISTS mb_addr3 text,                  -- 참고항목
  ADD COLUMN IF NOT EXISTS mb_zip text,                    -- 우편번호
  ADD COLUMN IF NOT EXISTS mb_content text;                -- 메모
