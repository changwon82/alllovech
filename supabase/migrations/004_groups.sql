-- ============================================================
-- Phase 3: 소그룹 나눔 (groups, comments, reactions)
-- 테이블 먼저 전부 생성 → RLS 정책은 마지막에 추가
-- ============================================================

-- ======================== 테이블 생성 ========================

CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'small_group'
    CHECK (type IN ('small_group', 'district', 'department', 'edu_class', 'one_on_one')),
  parent_id   UUID REFERENCES groups,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  group_id   UUID REFERENCES groups ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles ON DELETE CASCADE,
  role       TEXT DEFAULT 'member'
    CHECK (role IN ('leader', 'sub_leader', 'teacher', 'deacon', 'member')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE reflection_group_shares (
  reflection_id  UUID REFERENCES reflections ON DELETE CASCADE,
  group_id       UUID REFERENCES groups ON DELETE CASCADE,
  PRIMARY KEY (reflection_id, group_id)
);

CREATE TABLE reflection_comments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id  UUID NOT NULL REFERENCES reflections ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  content        TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reflection_reactions (
  reflection_id  UUID REFERENCES reflections ON DELETE CASCADE,
  user_id        UUID REFERENCES profiles ON DELETE CASCADE,
  type           TEXT DEFAULT 'amen'
    CHECK (type IN ('amen')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reflection_id, user_id)
);

-- ======================== RLS 활성화 ========================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_group_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_reactions ENABLE ROW LEVEL SECURITY;

-- ======================== RLS 정책 ========================

-- groups --
CREATE POLICY "groups_select_member" ON groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()));
CREATE POLICY "groups_select_admin" ON groups FOR SELECT
  USING (public.has_role('ADMIN'));
CREATE POLICY "groups_insert_admin" ON groups FOR INSERT
  WITH CHECK (public.has_role('ADMIN'));
CREATE POLICY "groups_update_admin" ON groups FOR UPDATE
  USING (public.has_role('ADMIN'));

-- group_members --
CREATE POLICY "gm_select_same_group" ON group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM group_members my WHERE my.group_id = group_members.group_id AND my.user_id = auth.uid()));
CREATE POLICY "gm_select_own" ON group_members FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "gm_select_admin" ON group_members FOR SELECT
  USING (public.has_role('ADMIN'));
CREATE POLICY "gm_insert_admin" ON group_members FOR INSERT
  WITH CHECK (public.has_role('ADMIN'));
CREATE POLICY "gm_delete_admin" ON group_members FOR DELETE
  USING (public.has_role('ADMIN'));

-- reflection_group_shares --
CREATE POLICY "rgs_insert_own" ON reflection_group_shares FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM reflections r WHERE r.id = reflection_id AND r.user_id = auth.uid()));
CREATE POLICY "rgs_delete_own" ON reflection_group_shares FOR DELETE
  USING (EXISTS (SELECT 1 FROM reflections r WHERE r.id = reflection_id AND r.user_id = auth.uid()));
CREATE POLICY "rgs_select_group_member" ON reflection_group_shares FOR SELECT
  USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = reflection_group_shares.group_id AND gm.user_id = auth.uid()));

-- reflection_comments --
CREATE POLICY "comments_select" ON reflection_comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM reflections r WHERE r.id = reflection_id AND r.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM reflection_group_shares rgs
      JOIN group_members gm ON gm.group_id = rgs.group_id
      WHERE rgs.reflection_id = reflection_comments.reflection_id AND gm.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM reflections r WHERE r.id = reflection_id AND r.visibility = 'public')
  );
CREATE POLICY "comments_insert" ON reflection_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM reflection_group_shares rgs
        JOIN group_members gm ON gm.group_id = rgs.group_id
        WHERE rgs.reflection_id = reflection_comments.reflection_id AND gm.user_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM reflections r WHERE r.id = reflection_id AND (r.user_id = auth.uid() OR r.visibility = 'public'))
    )
  );
CREATE POLICY "comments_delete_own" ON reflection_comments FOR DELETE
  USING (auth.uid() = user_id);

-- reflection_reactions --
CREATE POLICY "reactions_select" ON reflection_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reflection_group_shares rgs
      JOIN group_members gm ON gm.group_id = rgs.group_id
      WHERE rgs.reflection_id = reflection_reactions.reflection_id AND gm.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM reflections r WHERE r.id = reflection_id AND (r.user_id = auth.uid() OR r.visibility = 'public'))
  );
CREATE POLICY "reactions_insert" ON reflection_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM reflection_group_shares rgs
        JOIN group_members gm ON gm.group_id = rgs.group_id
        WHERE rgs.reflection_id = reflection_reactions.reflection_id AND gm.user_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM reflections r WHERE r.id = reflection_id AND (r.user_id = auth.uid() OR r.visibility = 'public'))
    )
  );
CREATE POLICY "reactions_delete_own" ON reflection_reactions FOR DELETE
  USING (auth.uid() = user_id);
