-- ============================================================
-- posts 테이블 마이그레이션
-- 기존 posts 테이블에 누락된 컬럼을 추가합니다.
-- Supabase SQL Editor에서 이 파일을 먼저 실행한 뒤,
-- schema.sql을 다시 실행하세요.
-- ============================================================

-- 새 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_id uuid references auth.users on delete set null;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS content text not null default '';

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS category text not null default 'general';

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_public boolean not null default false;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();

-- category 체크 제약조건 (이미 없을 때만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_category_check'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_category_check
      CHECK (category IN ('general', 'prayer', 'testimony'));
  END IF;
END $$;
