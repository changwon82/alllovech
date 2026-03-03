-- 카카오 OAuth 가입 시 status를 바로 'active'로 설정
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, status)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'user_name',
      '이름 없음'
    ),
    NEW.raw_user_meta_data ->> 'avatar_url',
    CASE
      WHEN NEW.raw_app_meta_data ->> 'provider' = 'kakao' THEN 'active'
      ELSE 'pending'
    END
  );
  RETURN NEW;
END;
$$;
