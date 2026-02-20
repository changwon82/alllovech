# 다애교회 365 성경읽기 프로젝트 규칙

## 기술 스택
- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Supabase (Auth, Database, Realtime)
- Vercel 배포

## 성능 최적화 (항상 적용)
- 서버 컴포넌트에서 `getUser()` 대신 `getSessionUser()` 사용 (네트워크 호출 제거)
- DB 쿼리는 가능한 한 `Promise.all`로 병렬 실행
- 페이지 간 이동 시 불필요한 redirect 금지 — 서버에서 바로 렌더링
- `useTransition` + `router.push`로 페이지 전환 시 이전 내용 유지
- `unstable_cache`로 정적/반정적 데이터 캐싱
- 이미지/폰트는 최소한으로 — `display: swap`, 필요한 weight만 로드

## 반응형 디자인 (항상 적용)
- 모바일 우선 (mobile-first) 설계 — 기본 스타일이 모바일, `md:` 이상이 데스크톱
- 최대 너비 `max-w-2xl` (672px) 중앙 정렬 기본 레이아웃 (admin은 `max-w-4xl` 허용)
- 터치 타겟 최소 44px (`py-2 px-3` 이상)
- 하단 네비게이션 고려하여 `pb-20` 여백 확보
- 텍스트 크기: 모바일에서 읽기 편한 `text-sm` ~ `text-base` 기본

## 디자인 시스템 (항상 적용)

### 색상 역할
- **navy** (`#002c60`) = Primary — 버튼, 제목, CTA
- **accent** (`#d4a04a`) = 완료/강조/배지 — 따뜻한 금색 (찬송가 금박)
- **accent-light** (`#faf4e8`) = accent 배경 — isToday, 하이라이트 카드
- **blue** (`#4d62f8`) = 번역본 선택 등 인터랙티브 UI (제한적 사용)

### 카드/컨테이너
- 카드: `bg-white shadow-sm rounded-2xl` — border 없음, shadow로 계층 구분
- hover 카드 (링크): `hover:shadow-md transition-shadow` 추가
- 하이라이트 카드 (isToday/pending): `bg-accent-light` 사용

### 버튼
- Primary: `rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white`
- 모든 버튼: `transition-all hover:brightness-110 active:scale-95`
- `hover:bg-navy/90` 대신 `hover:brightness-110` 사용

### 공통 컴포넌트 (`app/components/ui/`)
- `Card` — padding 변형 sm/md/lg
- `PageHeader` — H1 `text-[32px]` + accent bar `h-1 w-12 rounded-full bg-accent`
- `StatCard` — 숫자 + 라벨, color: navy/accent/neutral
- `Badge` — `rounded-full`, variant: default/accent/navy
- `PrimaryButton` / `primaryButtonClass` — Link에서도 사용 가능

### accent bar
- 페이지 제목 하단: `h-1 w-12 rounded-full bg-accent` (기존 `bg-blue` 사용 금지)

### 스켈레톤/로딩
- `border` 대신 `bg-white shadow-sm rounded-2xl` + `animate-pulse`

## 코드 패턴
- 관리자 페이지: `requireAdmin()` → `admin` (service role) 클라이언트로 데이터 조회
- 인증 필요 페이지: `getSessionUser()` → user 없으면 `/login?next=` 리다이렉트
- 컴포넌트 파일명: PascalCase, server action 파일: `actions.ts`
- 한국어 UI, 한국어 주석
