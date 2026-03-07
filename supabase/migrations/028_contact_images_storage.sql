-- contact-images 버킷 생성
INSERT INTO storage.buckets (id, name, public) VALUES ('contact-images', 'contact-images', true)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload contact images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contact-images');

-- 누구나 읽기 가능 (관리자가 이메일/알림에서 확인)
CREATE POLICY "Public read contact images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'contact-images');
