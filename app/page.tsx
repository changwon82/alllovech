import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { primaryButtonClass } from "@/app/components/ui/PrimaryButton";
import LoginForm from "@/app/login/LoginForm";
import LogoutButton from "@/app/components/LogoutButton";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileName: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    profileName = data?.name ?? null;
  }

  return (
    <div className="min-h-dvh bg-[#f2f4f7]">
      {/* ── 히어로 헤더 ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#4ba3ec] via-[#3d8fd6] to-[#2d72b8] pb-20 pt-10">
        {/* 배경 구름 장식 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-12 top-0 h-56 w-56 rounded-full bg-white/[0.07]" />
          <div className="absolute -right-4 top-32 h-36 w-36 rounded-full bg-white/[0.05]" />
          <div className="absolute bottom-0 right-8 h-64 w-80 rounded-[40%] bg-white/[0.04]" />
          <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-white/[0.04]" />
        </div>

        {/* 상단 아이콘 (알림 + 설정) */}
        <div className="relative mx-auto flex max-w-2xl items-center justify-end gap-3 px-5">
          <Link href="/notifications" className="relative text-white/80 transition-colors hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-[22px] w-[22px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-400 ring-2 ring-[#4ba3ec]" />
          </Link>
          <Link href="/my" className="text-white/80 transition-colors hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-[22px] w-[22px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </Link>
        </div>

        {/* 로고 + 교회명 + 설교 썸네일 */}
        <div className="relative mx-auto mt-8 max-w-2xl px-5">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 로고 + 교회명 */}
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="다애교회"
                width={56}
                height={56}
                priority
                className="brightness-0 invert opacity-90"
              />
              <div className="flex h-[50px] w-fit flex-col justify-between">
                <p className="text-[9px] font-medium tracking-[0.18em] text-white/45">대한예수교장로회(합신)</p>
                <h2 className="text-[24px] font-bold leading-none tracking-[0.08em] text-white">다애교회</h2>
                <p className="self-stretch text-center text-[9.5px] font-medium tracking-[0.15em] text-white/35">ALL LOVE CHURCH</p>
              </div>
            </div>

            {/* 오른쪽: 이번 주일 설교 썸네일 */}
            <a
              href="https://youtu.be/zAsVsgfh4kc"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative shrink-0 overflow-hidden rounded-lg shadow-lg"
            >
              <Image
                src="https://img.youtube.com/vi/zAsVsgfh4kc/mqdefault.jpg"
                alt="이번 주일 설교"
                width={140}
                height={79}
                className="rounded-lg object-cover transition-transform group-hover:scale-105"
              />
              {/* 재생 버튼 오버레이 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="ml-0.5 h-4 w-4">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-3 text-[9px] font-medium text-white">이번 주일 설교</p>
            </a>
          </div>

          {user && profileName && (
            <p className="mt-5 text-[14px] text-white/75">
              <span className="font-semibold text-white">{profileName}</span>님, 환영합니다
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4">
        {/* ── 메인 메뉴 그리드 ── */}
        <div className="-mt-10 rounded-2xl bg-white px-2 py-6 shadow-sm">
          <div className="grid grid-cols-4 gap-y-5">
            <MenuIcon href="/365bible" src="/icons/bible.svg" label="성경읽기" />
            <MenuIcon href="/my" src="/icons/chart.webp" label="나의기록" />
            <MenuIcon href="/365bible/groups" src="/icons/people.webp" label="함께읽기" />
            <MenuIcon href="/notifications" src="/icons/bell.webp" label="알림" />
            <MenuIcon href="/sermon" src="/icons/mail.webp" label="설교" />
            <MenuIcon href="/gallery" src="/icons/news.webp" label="사진갤러리" />
            <MenuIcon href="/jubo" src="/icons/heart.webp" label="주보" />
            <MenuIcon href="/news" src="/icons/chat.webp" label="교회소식" />
          </div>

          {/* 인디케이터 */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            <span className="h-[5px] w-4 rounded-full bg-[#4ba3ec]" />
            <span className="h-[5px] w-[5px] rounded-full bg-neutral-200" />
          </div>
        </div>

        {/* ── 빠른 접근 (연한 파란 테두리) ── */}
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/60 px-2 py-4">
          <div className="grid grid-cols-4">
            <QuickLink href="/365bible" src="/icons/calendar.webp" label="오늘의 말씀" />
            <QuickLink href="/365bible/groups" src="/icons/people.webp" label="그룹참여" />
            <QuickLink href="/my" src="/icons/check.webp" label="출석체크" />
            <QuickLink href="#" src="/icons/notebook.webp" label="교회안내" />
          </div>
        </div>

        {/* ── 공지사항 ── */}
        <div className="mt-4 rounded-2xl bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-neutral-800">공지사항</h3>
            <span className="flex items-center gap-0.5 text-xs text-neutral-400">
              더보기
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </span>
          </div>
          <div className="mt-3 divide-y divide-neutral-100">
            <div className="flex items-center gap-3 py-2">
              <span className="shrink-0 text-[11px] font-bold text-sky-500">공지사항</span>
              <span className="truncate text-[13px] text-neutral-600">365 성경읽기 함께 참여해요!</span>
              <span className="ml-auto flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">N</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <span className="shrink-0 text-[11px] font-bold text-sky-500">공지사항</span>
              <span className="truncate text-[13px] text-neutral-600">다애교회에 오신 것을 환영합니다</span>
            </div>
          </div>
        </div>

        {/* ── 기존 콘텐츠 ── */}
        <div className="mt-6 flex flex-col items-center gap-5 pb-8">
          <div className="flex w-full max-w-xs flex-col items-center gap-5">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="다애교회" width={56} height={56} />
              <div className="flex flex-col items-center justify-center">
                <h1 className="text-[28px] font-bold leading-tight text-navy">다애교회</h1>
                <p className="mt-0.5 text-[13px] text-neutral-400">All Love Church</p>
              </div>
            </div>

            {user ? (
              <div className="mt-2 w-full rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-neutral-500">
                    {profileName ?? "이름 없음"}님, 환영합니다
                  </p>
                  <LogoutButton />
                </div>
                <Link href="/365bible" className={`${primaryButtonClass} w-full`}>
                  365 성경읽기
                </Link>
              </div>
            ) : (
              <>
                <div className="w-full rounded-2xl bg-white p-5 shadow-sm">
                  <Link href="/365bible" className={`${primaryButtonClass} w-full`}>
                    365 성경읽기
                  </Link>
                </div>

                <div className="w-full rounded-2xl bg-white p-6 shadow-sm">
                  <p className="mb-1 text-center text-sm font-bold text-navy">로그인</p>
                  <LoginForm />
                  <p className="mt-5 text-center text-sm text-neutral-500">
                    아직 계정이 없으신가요?{" "}
                    <Link href="/signup" className="font-medium text-navy hover:underline">
                      회원가입
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 메뉴 아이콘 ── */
function MenuIcon({ href, src, label }: { href: string; src: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1.5 transition-transform active:scale-95">
      <Image src={src} alt={label} width={48} height={48} className="drop-shadow-sm" />
      <span className="text-[11px] font-medium text-neutral-600">{label}</span>
    </Link>
  );
}

/* ── 빠른 접근 링크 ── */
function QuickLink({ href, src, label }: { href: string; src: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1.5 transition-transform active:scale-95">
      <Image src={src} alt={label} width={36} height={36} className="drop-shadow-sm" />
      <span className="text-[10px] font-medium text-neutral-500">{label}</span>
    </Link>
  );
}
