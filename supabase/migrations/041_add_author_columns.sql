-- news_posts, brothers_posts에 author 컬럼 추가
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS author TEXT DEFAULT '다애교회';
ALTER TABLE brothers_posts ADD COLUMN IF NOT EXISTS author TEXT DEFAULT '다애교회';
