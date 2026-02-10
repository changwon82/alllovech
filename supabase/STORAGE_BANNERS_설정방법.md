# Storage "banners" 버킷 설정 방법

배너 이미지 업로드를 위해 Supabase Storage에 `banners` 버킷을 만들고, **공개 읽기** + **관리자만 업로드** 정책을 넣는 방법입니다.

---

## 방법 A: SQL로 한 번에 하기 (권장)

1. Supabase 대시보드 → **SQL Editor** 이동
2. **New query** 선택
3. 프로젝트에 있는 `supabase/storage_banners_policies.sql` 파일 내용을 **전부 복사**해서 붙여넣기
4. **Run** 실행

이렇게 하면 버킷 생성 + 읽기/쓰기 정책이 한 번에 적용됩니다.

- 버킷이 이미 있으면 `on conflict`로 업데이트만 됩니다.
- 정책은 `drop policy if exists` 후 다시 만들어서, 여러 번 실행해도 괜찮습니다.

---

## 방법 B: 대시보드에서 직접 하기

### 1단계: 버킷 만들기

1. Supabase 대시보드 → 왼쪽 메뉴 **Storage** 클릭
2. **New bucket** 클릭
3. 설정:
   - **Name**: `banners` (정확히 이 이름)
   - **Public bucket**: **켜기** (공개 읽기 허용)
   - (선택) File size limit: 5MB 등 원하는 값
4. **Create bucket** 클릭

### 2단계: 정책(Policies) 추가

1. 방금 만든 **banners** 버킷 행에서 **⋮** 또는 버킷 이름 클릭 후 설정/정책 메뉴로 이동
2. **Policies** 탭 선택
3. 아래 정책을 **하나씩** 추가합니다.

#### (1) 누구나 읽기 (SELECT)

- **New Policy** → **For full customization** (또는 "Create policy from scratch")
- **Policy name**: `banners_public_read`
- **Allowed operation**: **SELECT (read)** 만 체크
- **Target roles**: `public` 또는 비워두기
- **USING expression**:
  ```sql
  bucket_id = 'banners'
  ```
- **Create policy** 클릭

#### (2) 관리자만 업로드 (INSERT)

- **New Policy** → **For full customization**
- **Policy name**: `banners_admin_insert`
- **Allowed operation**: **INSERT (create)** 만 체크
- **WITH CHECK expression**:
  ```sql
  bucket_id = 'banners'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
  ```
- **Create policy** 클릭

#### (3) 관리자만 수정 (UPDATE)

- **Policy name**: `banners_admin_update`
- **Allowed operation**: **UPDATE**
- **USING expression**:
  ```sql
  bucket_id = 'banners'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
  ```

#### (4) 관리자만 삭제 (DELETE)

- **Policy name**: `banners_admin_delete`
- **Allowed operation**: **DELETE**
- **USING expression**: (3)번과 동일
  ```sql
  bucket_id = 'banners'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
  ```

---

## 확인

- **공개 읽기**: 로그인 없이도 `https://<프로젝트>.supabase.co/storage/v1/object/public/banners/...` 로 이미지 접근 가능
- **관리자만 업로드**: 관리자로 로그인한 계정으로만 `/admin/banners`에서 이미지 추가·수정·삭제 가능

이미 `public_banners` 테이블과 RLS는 `banners_schema.sql`로 적용했다면, 위 Storage 설정만 하면 배너 관리 기능을 사용할 수 있습니다.
