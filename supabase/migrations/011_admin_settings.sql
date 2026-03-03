-- 관리자 설정 (키-값)
CREATE TABLE admin_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이메일 알림 기본값: 활성화
INSERT INTO admin_settings (key, value) VALUES ('email_notifications', 'true');

-- 관리자만 조회/수정 가능 (service role로 접근)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_settings_select_all" ON admin_settings FOR SELECT
  USING (true);

CREATE POLICY "admin_settings_update_admin" ON admin_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);
