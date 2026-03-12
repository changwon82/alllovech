import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HeroSlider from "@/app/components/HeroSlider";
import ChurchMap from "@/app/components/ChurchMap";

const R2_GALLERY = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/gallery";
const R2_JUBO = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/jubo";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileResult, sermonsResult, newsResult, brothersResult, juboResult, galleryResult, heroResult] = await Promise.all([
    user
      ? supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("sermons")
      .select("id, title, preacher, sermon_date, scripture, category, youtube_url")
      .order("sermon_date", { ascending: false })
      .limit(4),
    supabase
      .from("news_posts")
      .select("id, title, post_date")
      .order("post_date", { ascending: false })
      .limit(5),
    supabase
      .from("brothers_posts")
      .select("id, title, post_date")
      .order("post_date", { ascending: false })
      .limit(5),
    supabase
      .from("jubo_posts")
      .select("id, title, post_date, jubo_images(file_name, sort_order)")
      .order("post_date", { ascending: false })
      .limit(1),
    supabase
      .from("gallery_posts")
      .select("id, title, post_date, category, gallery_images(file_name, sort_order)")
      .order("post_date", { ascending: false })
      .limit(8),
    supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "hero_slides")
      .maybeSingle(),
  ]);

  const profileName = profileResult.data?.name ?? null;
  const sermons = sermonsResult.data ?? [];
  const newsPosts = newsResult.data ?? [];
  const brothersPosts = brothersResult.data ?? [];
  const juboPosts = juboResult.data ?? [];
  const galleryPosts = galleryResult.data ?? [];

  let heroSlides;
  try {
    if (heroResult.data?.value) heroSlides = JSON.parse(heroResult.data.value);
  } catch { /* 기본값 사용 */ }

  function fmtDate(d: string | null): string {
    if (!d) return "";
    const date = new Date(d);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  function ytId(url: string | null): string | null {
    if (!url) return null;
    return url.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]+)/)?.[1] ?? null;
  }

  return (
    <div className="min-h-dvh">

      {/* ═══════════════════════════════════════════════
          HERO — 3장 자동 슬라이드 + 서비스 아이콘
          원본: #main_visual + #service_wrap
      ═══════════════════════════════════════════════ */}
      <section className="relative h-[40vh] md:h-[47vh]">
        <HeroSlider slides={heroSlides}>
          {/* 우측: 서비스 아이콘 — 모바일에서 숨기고 아래에 별도 배치 */}
          <div className="mb-8 hidden shrink-0 grid-cols-3 gap-[1px] md:mb-16 md:grid">
            <HeroIcon href="/about" label="교회소개">
              <Image src="/logo.png" alt="다애교회" width={28} height={28} className="brightness-0 invert" />
            </HeroIcon>
            <HeroIcon href="/worship" label="예배안내">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </HeroIcon>
            <HeroIcon href="/jubo" label="주보">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
            </HeroIcon>
            <HeroIcon href="/news" label="교회소식">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
            </HeroIcon>
            <HeroIcon href="/gallery" label="다애사진">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
            </HeroIcon>
            <HeroIcon href="/365bible/groups" label="함께읽기">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
            </HeroIcon>
          </div>
        </HeroSlider>
      </section>

      {/* 모바일 서비스 아이콘 */}
      <div className="grid grid-cols-3 gap-[1px] bg-neutral-100 md:hidden">
        <MobileIcon href="/about" label="교회소개">
          <Image src="/logo.png" alt="다애교회" width={24} height={24} className="brightness-0 invert" />
        </MobileIcon>
        <MobileIcon href="/worship" label="예배안내">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
        </MobileIcon>
        <MobileIcon href="/jubo" label="주보">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
        </MobileIcon>
        <MobileIcon href="/news" label="교회소식">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
        </MobileIcon>
        <MobileIcon href="/gallery" label="다애사진">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
        </MobileIcon>
        <MobileIcon href="/365bible/groups" label="함께읽기">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
        </MobileIcon>
      </div>

      {/* ═══════════════════════════════════════════════
          본문 콘텐츠
      ═══════════════════════════════════════════════ */}
      <div className="bg-[#f2f4f7]">

        {/* ── 설교 섹션 (원본 #comm_wrap) ── */}
        {sermons.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-neutral-800">예배영상</h2>
              <Link href="/sermon" className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-300 transition hover:bg-neutral-200 hover:text-neutral-500" title="더보기"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></Link>
            </div>
            {/* 모바일: 가로형 2개 */}
            <div className="mt-5 space-y-3 md:hidden">
              {sermons.slice(0, 3).map((s) => {
                const id = ytId(s.youtube_url);
                return (
                  <Link key={s.id} href={`/sermon/${s.id}`} className="group flex gap-3">
                    <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                      {id && (
                        <Image src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt={s.title} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col justify-center">
                      <p className="truncate text-[14px] font-bold text-neutral-800">{s.title}</p>
                      {s.scripture && <p className="mt-0.5 truncate text-[12px] text-neutral-500">{s.scripture}</p>}
                      <p className="mt-0.5 text-[12px] text-neutral-400">{s.category ?? "주일예배"} · {s.preacher}</p>
                      <p className="mt-0.5 text-[11px] text-neutral-300">{fmtDate(s.sermon_date)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* 데스크톱: 기존 그리드 4개 */}
            <div className="mt-5 hidden grid-cols-4 gap-4 md:grid">
              {sermons.map((s) => {
                const id = ytId(s.youtube_url);
                return (
                  <Link key={s.id} href={`/sermon/${s.id}`} className="group">
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-200">
                      {id && (
                        <Image src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt={s.title} fill className="object-cover transition-transform group-hover:scale-105" />
                      )}
                      {id && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="ml-0.5 h-5 w-5">
                              <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2">
                        <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">{fmtDate(s.sermon_date)}</span>
                      </div>
                    </div>
                    <p className="mt-2 truncate text-[14px] font-bold text-neutral-800">{s.title}</p>
                    {s.scripture && <p className="mt-0.5 truncate text-[12px] text-neutral-500">{s.scripture}</p>}
                    <p className="mt-0.5 text-[12px] text-neutral-400">{s.category ?? "주일예배"} · {s.preacher}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 교회소식 / 교우소식 / 주보 ── */}
        <section className="bg-white py-12">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3 md:px-8">
            {/* 교회소식 */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-neutral-800">교회소식</h2>
                <Link href="/news" className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-300 transition hover:bg-neutral-200 hover:text-neutral-500" title="더보기"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></Link>
              </div>
              <div className="mt-3 divide-y divide-neutral-100">
                {newsPosts.map((p, i) => (
                  <Link key={p.id} href={`/news/${p.id}`} className={`flex items-center justify-between py-2.5 transition-colors hover:text-navy${i >= 3 ? " hidden md:flex" : ""}`}>
                    <span className="truncate text-[13px] text-neutral-700">{p.title}</span>
                    <span className="ml-3 shrink-0 text-[11px] text-neutral-300">{fmtDate(p.post_date)}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 교우소식 */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-neutral-800">교우소식</h2>
                <Link href="/brothers" className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-300 transition hover:bg-neutral-200 hover:text-neutral-500" title="더보기"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></Link>
              </div>
              <div className="mt-3 divide-y divide-neutral-100">
                {brothersPosts.map((p: any, i: number) => (
                  <Link key={p.id} href={`/brothers/${p.id}`} className={`flex items-center justify-between py-2.5 transition-colors hover:text-navy${i >= 2 ? " hidden md:flex" : ""}`}>
                    <span className="truncate text-[13px] text-neutral-700">{p.title}</span>
                    <span className="ml-3 shrink-0 text-[11px] text-neutral-300">{fmtDate(p.post_date)}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 주보 — 최신 1건 이미지 (모바일 숨김) */}
            <div className="hidden flex-col md:flex">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-neutral-800">주보</h2>
                <Link href="/jubo" className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-300 transition hover:bg-neutral-200 hover:text-neutral-500" title="더보기"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></Link>
              </div>
              {juboPosts[0] && (() => {
                const jubo = juboPosts[0] as any;
                const img = jubo.jubo_images
                  ?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0];
                return (
                  <Link href={`/jubo/${jubo.id}`} className="mt-3 block flex-1 group">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-100 md:aspect-auto md:h-full">
                      {img && (
                        <Image
                          src={`${R2_JUBO}/${img.file_name}`}
                          alt={jubo.title}
                          fill
                          className="object-cover object-top transition-transform group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/40 px-3 py-2 transition-colors group-hover:bg-black/70">
                        <p className="truncate text-center text-[13px] font-medium text-white">{jubo.title}</p>
                      </div>
                    </div>
                  </Link>
                );
              })()}
            </div>
          </div>
        </section>

        {/* ── 사역 소개 (원본 #business_wrap) — 임시 주석 처리
        <section className="bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <h2 className="text-center text-[20px] font-bold text-neutral-800">다애교회 사역</h2>
            <p className="mt-2 text-center text-[13px] text-neutral-400">
              하나님의 마음에 합한 교회로 쓰임받길 기도합니다
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
              <MinistryCard icon="📖" title="성경 일독학교 사역" desc="평신도 성경교사가 성경방 운영" sub="어? 성경이 읽어지네!" />
              <MinistryCard icon="🌍" title="에즈마이야 운동" desc="이민 2세대들의 영어사역" sub="농어촌교회 사회 재건" />
              <MinistryCard icon="🎓" title="맞춤교육사역" desc="각 개인 신앙 진단에" sub="따른 교육" />
              <MinistryCard icon="👨‍👩‍👧" title="부모교사" desc="부모가 교사가 되는" sub="성경적 주교 모델" />
            </div>
          </div>
        </section>
        ── */}

        {/* ── 다애사진 (원본 #pro_wrap) ── */}
        {galleryPosts.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-neutral-800">다애사진</h2>
              <Link href="/gallery" className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-300 transition hover:bg-neutral-200 hover:text-neutral-500" title="더보기"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {galleryPosts.map((post: any) => {
                const img = post.gallery_images
                  ?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0];
                return (
                  <Link key={post.id} href={`/gallery/${post.id}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-200">
                    {img && (
                      <Image src={`${R2_GALLERY}/${img.file_name}`} alt={post.title} fill className="object-cover transition-transform group-hover:scale-105" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/40 px-3 py-2 transition-colors group-hover:bg-black/70">
                      <p className="truncate text-center text-[12px] font-medium text-white">{post.title}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 헌금안내 (원본 #comm_area 하단) ── */}
        <section className="bg-white py-12">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-5 md:px-8">
            {/* 헌금안내 — 2/5 너비 */}
            <div className="md:col-span-2">
              <div className="overflow-hidden rounded-2xl bg-navy text-white">
                {/* 계좌 정보 */}
                <div className="p-5">
                  <p className="mb-3 text-base font-bold">온라인 헌금안내</p>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white">일반헌금</span>
                      <span className="ml-2 font-medium tracking-wide">[하나은행] 374-910038-20304</span>
                    </div>
                    <div>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white">건축헌금</span>
                      <span className="ml-2 font-medium tracking-wide">[하나은행] 374-910038-21004</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium text-white/50 md:text-sm">* 계좌이체시 이름과 항목 기재 (예: 홍길동감사, 홍길동A십일조)</p>
                </div>
                {/* 기타안내 */}
                <div className="flex divide-x divide-white/10 border-t border-white/10 text-sm">
                  <a href="https://mas3.ohjic.com/member/intro/alc" target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col items-center gap-1 py-3.5 text-white/60 transition hover:bg-white/5 hover:text-white">
                    <span>💳</span><span>모바일 헌금</span>
                  </a>
                  <a href="https://support.apple.com/ko-kr" target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col items-center gap-1 py-3.5 text-white/60 transition hover:bg-white/5 hover:text-white">
                    <span>📱</span><span>아이폰 문제</span>
                  </a>
                  <a href="https://mas3.ohjic.com/member/intro/alc" target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col items-center gap-1 py-3.5 text-white/60 transition hover:bg-white/5 hover:text-white">
                    <span>🧾</span><span>기부금영수증</span>
                  </a>
                </div>
              </div>
              <a href="https://mas3.ohjic.com/member/intro/alc" target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-between rounded-2xl bg-[#4a7fb5] p-5 text-white transition hover:brightness-110">
                <div>
                  <p className="text-base font-bold">온라인 교인센터</p>
                  <p className="mt-1.5 text-sm text-white/70">온라인 교인증, 나의 교적 정보</p>
                  <p className="text-sm text-white/70">나의 헌금내역, 기부금 영수증</p>
                </div>
                <svg viewBox="0 0 48 48" className="h-14 w-14 shrink-0 text-white/90"><rect x="4" y="8" width="40" height="32" rx="5" fill="currentColor"/><circle cx="18" cy="20" r="5.5" fill="#4a7fb5"/><path d="M8 34c0-4.5 4.5-8 10-8s10 3.5 10 8" fill="#4a7fb5"/><rect x="30" y="16" width="10" height="2.5" rx="1.25" fill="#4a7fb5"/><rect x="30" y="22" width="10" height="2.5" rx="1.25" fill="#4a7fb5"/><rect x="30" y="28" width="7" height="2.5" rx="1.25" fill="#4a7fb5"/></svg>
              </a>
            </div>

            {/* 찾아오시는 길 — 3/5 너비, 왼쪽 높이에 맞춤 */}
            <div className="flex flex-col md:col-span-3">
              <Link href="/about/location" className="text-[18px] font-bold text-neutral-800 hover:text-navy transition">오시는 길</Link>
              <div className="mt-4 aspect-[4/2] overflow-hidden rounded-2xl md:aspect-auto md:flex-1">
                <ChurchMap />
              </div>
              <p className="mt-3 text-sm text-neutral-600">서울 서초구 탑성말길 37 (신원동 561)</p>
              <div className="mt-2 flex gap-2">
                <a href="https://map.kakao.com/link/search/서울 서초구 탑성말길 37" target="_blank" rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
                  <svg viewBox="0 0 24 24" className="h-4 w-4"><circle cx="12" cy="12" r="12" fill="#FEE500"/><path d="M12 6.5c-3.31 0-6 2.015-6 4.5 0 1.594 1.06 2.993 2.656 3.785l-.67 2.465c-.05.186.163.334.32.222l2.94-1.96c.244.025.494.038.754.038 3.31 0 6-2.015 6-4.5S15.31 6.5 12 6.5z" fill="#3C1E1E"/></svg>
                  카카오맵
                </a>
                <a href="https://map.naver.com/p/entry/place/1469260990" target="_blank" rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
                  <svg viewBox="0 0 24 24" className="h-4 w-4"><rect width="24" height="24" rx="4" fill="#03C75A"/><path d="M8 7.5h2.4l3.6 4.5V7.5H16v9h-2.4L10 12v4.5H8v-9z" fill="#fff"/></svg>
                  네이버맵
                </a>
                <a href="tmap://route?rGoalName=%EB%8B%A4%EC%95%A0%EA%B5%90%ED%9A%8C&rGoalX=127.0583&rGoalY=37.4553" target="_blank" rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
                  <svg viewBox="0 0 24 24" className="h-4 w-4"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FF3B7A"/><stop offset="50%" stopColor="#7B61FF"/><stop offset="100%" stopColor="#00C6FF"/></linearGradient></defs><rect width="24" height="24" rx="5" fill="url(#tg)"/><path d="M6 7h12v3.5h-4.25V17h-3.5V10.5H6V7z" fill="#fff"/></svg>
                  티맵
                </a>
              </div>
            </div>
          </div>
        </section>


      </div>
    </div>
  );
}


/* ── Hero 서비스 아이콘 (반투명 박스) ── */
function HeroIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex h-[90px] w-[100px] flex-col items-center justify-center gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95 md:h-[100px] md:w-[120px]"
    >
      {children}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

/* ── 모바일 서비스 아이콘 (밝은 배경) ── */
function MobileIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1.5 bg-white py-4 text-navy transition active:scale-95 active:bg-neutral-50"
    >
      {children}
      <span className="text-[11px] font-medium text-neutral-600">{label}</span>
    </Link>
  );
}

/* ── 사역 카드 ── */
function MinistryCard({ icon, title, desc, sub }: { icon: string; title: string; desc: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-3xl">{icon}</span>
      <p className="mt-3 text-[14px] font-bold text-neutral-800">{title}</p>
      <p className="mt-1 text-[12px] leading-snug text-neutral-400">{desc}<br />{sub}</p>
    </div>
  );
}
