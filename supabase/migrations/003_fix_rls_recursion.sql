-- ============================================================
-- Fix: user_roles RLS 무한 재귀 해결
-- SECURITY DEFINER 함수로 RLS 우회하여 역할 조회
-- ============================================================

-- 1. 역할 확인 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION public.has_role(check_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = check_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(check_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = ANY(check_roles)
  );
$$;

-- 2. user_roles: 자기참조 정책 삭제 후 재생성
DROP POLICY IF EXISTS "roles_select_admin" ON user_roles;
DROP POLICY IF EXISTS "roles_insert_admin" ON user_roles;
DROP POLICY IF EXISTS "roles_delete_admin" ON user_roles;

CREATE POLICY "roles_select_admin"
  ON user_roles FOR SELECT
  USING (public.has_role('ADMIN'));

CREATE POLICY "roles_insert_admin"
  ON user_roles FOR INSERT
  WITH CHECK (public.has_role('ADMIN'));

CREATE POLICY "roles_delete_admin"
  ON user_roles FOR DELETE
  USING (public.has_role('ADMIN'));

-- 3. bible_checks: 리더 조회 정책도 수정
DROP POLICY IF EXISTS "checks_select_leaders" ON bible_checks;

CREATE POLICY "checks_select_leaders"
  ON bible_checks FOR SELECT
  USING (public.has_any_role(ARRAY['ADMIN', 'PASTOR', 'STAFF']));

-- 4. reflections: 리더 조회 정책도 수정
DROP POLICY IF EXISTS "reflections_select_leaders" ON reflections;

CREATE POLICY "reflections_select_leaders"
  ON reflections FOR SELECT
  USING (public.has_any_role(ARRAY['ADMIN', 'PASTOR']));
