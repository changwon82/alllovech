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

## 코드 패턴
- 관리자 페이지: `requireAdmin()` → `admin` (service role) 클라이언트로 데이터 조회
- 인증 필요 페이지: `getSessionUser()` → user 없으면 `/login?next=` 리다이렉트
- 컴포넌트 파일명: PascalCase, server action 파일: `actions.ts`
- 한국어 UI, 한국어 주석
