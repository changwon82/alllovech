import Link from "next/link";
import Container from "@/src/components/Container";

export const metadata = { title: "처음 오신 분 — 다애교회" };

export default function WelcomeIndexPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-100 to-slate-200 px-4 py-12 dark:from-slate-800 dark:to-slate-900 sm:py-16">
        <Container size="xl" className="relative">
          <div className="flex flex-col items-start gap-4 sm:gap-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-4xl md:text-5xl">
              나를 따르라
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Follow Me! Deny yourself and take up the cross (Mt 16:24)
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              자기를 부인하고, 자기 십자가를 지고 (마 16:24)
            </p>
          </div>
          <div className="absolute bottom-4 right-4 sm:right-8 opacity-20">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-700 dark:text-slate-300">
              <path d="M12 2v20M5 9h14l-4 6 4 6H5l4-6-4-6z" />
            </svg>
          </div>
          <div className="mt-6 flex justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>
        </Container>
      </section>

      {/* 퀵링크 4개 */}
      <section className="-mt-2 px-4 pb-8 sm:-mt-4">
        <Container size="xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Link
              href="/welcome/services"
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-6 text-white transition hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              <span className="text-2xl">📄</span>
              <span className="text-center text-sm font-medium">주보·예배 안내</span>
            </Link>
            <Link
              href="/mission/offering"
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-6 text-white transition hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              <span className="text-2xl">❤️</span>
              <span className="text-center text-sm font-medium">헌금 안내</span>
            </Link>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-6 text-white transition hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              <span className="text-2xl">▶️</span>
              <span className="text-center text-sm font-medium">유튜브 채널</span>
            </a>
            <Link
              href="/worship/sermons"
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-6 text-white transition hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              <span className="text-2xl">📖</span>
              <span className="text-center text-sm font-medium">말씀·설교</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* 메인 그리드 */}
      <section className="px-4 pb-10">
        <Container size="xl" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 주일예배 말씀 카드 (큰 카드) */}
            <div className="lg:col-span-2">
              <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row">
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">주일예배 (2026-02-01)</p>
                    <h2 className="mt-1 text-xl font-bold text-neutral-800 dark:text-neutral-100 sm:text-2xl">
                      요한 : 사랑의 머무름
                    </h2>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">요 19:25~27, 계 1:9</p>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Link
                      href="/worship/sermons"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      말씀
                    </Link>
                    <Link
                      href="/worship/sermons"
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                    >
                      영상
                    </Link>
                  </div>
                </div>
                <div className="h-48 shrink-0 bg-neutral-200 dark:bg-neutral-700 sm:h-auto sm:w-64">
                  <div className="flex h-full w-full items-center justify-center text-neutral-400 dark:text-neutral-500">
                    [목사님 이미지]
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽 상단 2개 카드 */}
            <div className="space-y-4">
              <Link
                href="/welcome/education"
                className="block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📖</span>
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">다애 공동체 성경읽기</h3>
                </div>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  매일 말씀으로 함께 성장합니다.
                </p>
                <span className="mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400">
                  성경읽기 바로가기 →
                </span>
              </Link>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">매일 아침 만나는 큐티</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">생명의 삶</p>
                <div className="mt-3 h-20 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* 목사님 기억하기 + 새벽기도 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">담임목사 인사말</h3>
              <div className="mt-3 flex gap-4">
                <div className="h-20 w-20 shrink-0 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    다애교회에 오신 것을 환영합니다.
                  </p>
                  <Link href="/about" className="mt-2 inline-block text-sm font-medium text-blue-600 dark:text-blue-400">
                    홈페이지 바로가기 →
                  </Link>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">기도로 새벽을 열다</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">새벽기도회</p>
              <div className="mt-3 h-24 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-neutral-700 dark:to-neutral-800" />
            </div>
            {/* 예배/행사 버튼 그리드 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-3 font-semibold text-neutral-800 dark:text-neutral-100">예배·모임 안내</h3>
              <div className="grid grid-cols-3 gap-2">
                {["주일예배", "수요예배", "금요예배", "새벽기도", "청년예배", "어린이예배", "구역예배", "새가족교육", "선교부"].map((label) => (
                  <Link
                    key={label}
                    href="/worship"
                    className="rounded-lg bg-neutral-100 py-2.5 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 아이스쿨 / 프로그램 */}
            <div className="rounded-2xl border border-neutral-200 bg-sky-50/50 p-5 dark:border-neutral-800 dark:bg-sky-950/20">
              <h3 className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-100">
                양육·교육 프로그램
                <span className="text-xs text-neutral-400">ⓘ</span>
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                <li>· 일대일 양육 — 새가족 맞춤 양육</li>
                <li>· 구약/신약 성경반 — 정기 개설</li>
                <li>· 큐티스쿨 — 말씀 묵상 훈련</li>
              </ul>
            </div>
            {/* 보라통독 스타일 카드 */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white">
              <p className="text-sm opacity-90">두란노</p>
              <h3 className="mt-1 text-xl font-bold">성경 통독</h3>
              <p className="mt-1 text-sm opacity-90">말씀으로 하나님을 알아가는 성경읽기</p>
              <p className="mt-3 text-sm">기본/심화 · 정기 반 개설</p>
              <Link href="/welcome/education" className="mt-3 inline-block text-sm font-medium underline underline-offset-2">
                자세히 보기 →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 하단 4개 카드 */}
      <section className="border-t border-neutral-200 bg-white px-4 py-8 dark:border-neutral-800 dark:bg-neutral-900">
        <Container size="xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
              <h3 className="flex items-center gap-1 font-semibold text-neutral-800 dark:text-neutral-100">
                행사·소식
                <span className="text-neutral-400">ⓘ</span>
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                <li>· 다애교회 소식이 여기에 노출됩니다.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
              <h3 className="flex items-center gap-1 font-semibold text-neutral-800 dark:text-neutral-100">
                알림판
                <span className="text-neutral-400">ⓘ</span>
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                <li>· 공지사항이 여기에 노출됩니다.</li>
              </ul>
            </div>
            <Link
              href="/mission/offering"
              className="flex items-center gap-3 rounded-xl bg-slate-700 p-4 text-white transition hover:bg-slate-800"
            >
              <span className="text-2xl">📄</span>
              <span className="font-medium">기부금 영수증 발급</span>
            </Link>
            <div className="flex items-center gap-3 rounded-xl bg-slate-700 p-4 text-white">
              <span className="text-2xl">💬</span>
              <span className="font-medium">다애교회 상담</span>
            </div>
          </div>
        </Container>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-neutral-200 bg-neutral-100 px-4 py-10 dark:border-neutral-800 dark:bg-neutral-900">
        <Container size="xl">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div>
              <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">새가족 안내</h4>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="/welcome" className="hover:underline">환영 인사</Link></li>
                <li><Link href="/welcome/register" className="hover:underline">새가족 등록</Link></li>
                <li><Link href="/welcome/directions" className="hover:underline">오시는 길</Link></li>
                <li><Link href="/welcome/faq" className="hover:underline">자주 묻는 질문</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">교회 안내</h4>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="/about" className="hover:underline">담임목사 인사말</Link></li>
                <li><Link href="/about/vision" className="hover:underline">교회 비전</Link></li>
                <li><Link href="/about/history" className="hover:underline">교회 연혁</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">예배와 말씀</h4>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="/worship" className="hover:underline">주일 예배</Link></li>
                <li><Link href="/worship/sermons" className="hover:underline">예배 영상</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">공동체</h4>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="/community-info" className="hover:underline">소그룹·양육</Link></li>
                <li><Link href="/mission" className="hover:underline">선교와 사역</Link></li>
              </ul>
            </div>
          </div>
          <p className="mt-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
            © {new Date().getFullYear()} All Love Church 다애교회
          </p>
        </Container>
      </footer>
    </div>
  );
}
