# "Bucket not found" 해결 방법

Supabase **Dashboard**에서 버킷을 한 번 만드세요.

1. [Supabase](https://supabase.com/dashboard) 로그인 → 해당 프로젝트 선택
2. 왼쪽 메뉴 **Storage** 클릭
3. **New bucket** 클릭
4. 설정:
   - **Name**: `spend-report-receipts` (이름을 정확히 이렇게)
   - **Public bucket**: 켜기 (체크)
   - **File size limit**: 5 MB (원하면 더 크게)
5. **Create bucket** 클릭

이후 `storage-setup.sql`에서 **정책 부분만** 실행하세요 (버킷 생성하는 INSERT는 건너뛰어도 됨).
