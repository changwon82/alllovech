-- 알림 테이블
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('comment', 'amen', 'group_share')),
  actor_id    UUID REFERENCES profiles ON DELETE SET NULL,
  reference_id UUID,
  group_id    UUID REFERENCES groups ON DELETE SET NULL,
  message     TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_insert_any" ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  USING (auth.uid() = user_id);
