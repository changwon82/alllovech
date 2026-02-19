-- ============================================================
-- Phase 1: profiles, user_roles, bible_checks
-- ============================================================

-- 1. profiles --------------------------------------------------
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  avatar_url  TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'inactive')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 누구나 active 프로필 조회 가능
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- 본인만 자기 프로필 수정
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 가입 트리거용 insert 허용 (서비스 role)
CREATE POLICY "profiles_insert_self"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. user_roles ------------------------------------------------
CREATE TABLE user_roles (
  user_id  UUID REFERENCES profiles ON DELETE CASCADE,
  role     TEXT NOT NULL
    CHECK (role IN (
      'MEMBER','MEMBER_PENDING','GROUP_LEADER','DISTRICT_LEADER',
      'DEACON','EDU_MINISTER','TEACHER','PASTOR','STAFF','ADMIN'
    )),
  PRIMARY KEY (user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 본인 역할 조회
CREATE POLICY "roles_select_own"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ADMIN은 모든 역할 조회/수정 가능
CREATE POLICY "roles_select_admin"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'ADMIN'
    )
  );

CREATE POLICY "roles_insert_admin"
  ON user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'ADMIN'
    )
  );

CREATE POLICY "roles_delete_admin"
  ON user_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'ADMIN'
    )
  );

-- 3. bible_checks (읽기 체크) ----------------------------------
CREATE TABLE bible_checks (
  user_id     UUID REFERENCES profiles ON DELETE CASCADE,
  day         SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 365),
  year        SMALLINT NOT NULL,
  checked_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, day, year)
);

ALTER TABLE bible_checks ENABLE ROW LEVEL SECURITY;

-- 본인 체크 조회
CREATE POLICY "checks_select_own"
  ON bible_checks FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 체크 삽입
CREATE POLICY "checks_insert_own"
  ON bible_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 체크 삭제 (체크 해제)
CREATE POLICY "checks_delete_own"
  ON bible_checks FOR DELETE
  USING (auth.uid() = user_id);

-- ADMIN / PASTOR는 모든 체크 조회 가능
CREATE POLICY "checks_select_leaders"
  ON bible_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('ADMIN', 'PASTOR', 'STAFF')
    )
  );

-- 4. 가입 시 profiles 자동 생성 트리거 -------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'user_name',
      '이름 없음'
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
