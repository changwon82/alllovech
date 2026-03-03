-- avatars 버킷 생성 (프로필 사진 저장용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 본인 폴더만 업로드 가능
CREATE POLICY "avatar_upload_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 본인 폴더만 삭제 가능
CREATE POLICY "avatar_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 누구나 읽기 가능 (public 버킷)
CREATE POLICY "avatar_read_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
