-- ============================================================
-- Phase 2: reflections (묵상 기록)
-- ============================================================

CREATE TABLE reflections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  day         SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 365),
  year        SMALLINT NOT NULL,
  content     TEXT NOT NULL,
  visibility  TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'group', 'public')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, day, year)
);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- 본인 묵상 전체 조회
CREATE POLICY "reflections_select_own"
  ON reflections FOR SELECT
  USING (auth.uid() = user_id);

-- 공개 묵상 누구나 조회
CREATE POLICY "reflections_select_public"
  ON reflections FOR SELECT
  USING (visibility = 'public');

-- 본인 묵상 작성
CREATE POLICY "reflections_insert_own"
  ON reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 묵상 수정
CREATE POLICY "reflections_update_own"
  ON reflections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인 묵상 삭제
CREATE POLICY "reflections_delete_own"
  ON reflections FOR DELETE
  USING (auth.uid() = user_id);

-- ADMIN / PASTOR 전체 조회
CREATE POLICY "reflections_select_leaders"
  ON reflections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('ADMIN', 'PASTOR')
    )
  );
