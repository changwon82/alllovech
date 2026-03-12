import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";
import ChurchMap from "@/app/components/ChurchMap";
import ParkingMap from "./ParkingMap";

export const metadata = { title: "오시는 길 | 다애교회" };

export default function LocationPage() {
  return (
    <>
      <SubpageHeader
        title="교회소개"
        breadcrumbs={[
          { label: "교회소개", href: "/about" },
          { label: "오시는 길" },
        ]}
      />

      <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
        <SubpageSidebar
          title="교회소개"
          items={[
            { label: "인사말씀", href: "/about" },
            { label: "설립목사", href: "/about/founder" },
            { label: "교회연혁", href: "/about/history" },
            { label: "섬기는 사람들", href: "/about/staff" },
            { label: "오시는 길", href: "/about/location" },
          ]}
        />
        <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold text-navy md:text-2xl">오시는 길</h2>
        <div className="mt-1 h-1 w-12 rounded-full bg-accent" />

        {/* 지도 */}
        <div className="mt-8 h-[350px] overflow-hidden rounded-2xl">
          <ChurchMap />
        </div>

        {/* 주소 · 연락처 */}
        <div className="mt-6 rounded-2xl bg-neutral-50 p-5">
          <dl className="space-y-2 text-base text-neutral-700">
            <div className="flex gap-3">
              <dt className="shrink-0 font-bold text-navy">주소</dt>
              <dd>서울 서초구 탑성말길 37 (신원동 561)</dd>
            </div>
            <div className="flex gap-3">
              <dt className="shrink-0 font-bold text-navy">전화</dt>
              <dd>
                <a href="tel:02-573-5046" className="underline underline-offset-2">
                  02-573-5046
                </a>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="shrink-0 font-bold text-navy">이메일</dt>
              <dd>
                <a
                  href="mailto:alllovechurch@naver.com"
                  className="underline underline-offset-2"
                >
                  alllovechurch@naver.com
                </a>
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-2">
            <a href="https://map.kakao.com/link/search/서울 서초구 탑성말길 37" target="_blank" rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
              <svg viewBox="0 0 24 24" className="h-4 w-4"><circle cx="12" cy="12" r="12" fill="#FEE500"/><path d="M12 6.5c-3.31 0-6 2.015-6 4.5 0 1.594 1.06 2.993 2.656 3.785l-.67 2.465c-.05.186.163.334.32.222l2.94-1.96c.244.025.494.038.754.038 3.31 0 6-2.015 6-4.5S15.31 6.5 12 6.5z" fill="#3C1E1E"/></svg>
              카카오맵
            </a>
            <a href="https://map.naver.com/p/entry/place/1469260990" target="_blank" rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
              <svg viewBox="0 0 24 24" className="h-4 w-4"><rect width="24" height="24" rx="4" fill="#03C75A"/><path d="M8 7.5h2.4l3.6 4.5V7.5H16v9h-2.4L10 12v4.5H8v-9z" fill="#fff"/></svg>
              네이버맵
            </a>
            <a href="tmap://route?rGoalName=%EB%8B%A4%EC%95%A0%EA%B5%90%ED%9A%8C&rGoalX=127.0583&rGoalY=37.4553" target="_blank" rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
              <svg viewBox="0 0 24 24" className="h-4 w-4"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FF3B7A"/><stop offset="50%" stopColor="#7B61FF"/><stop offset="100%" stopColor="#00C6FF"/></linearGradient></defs><rect width="24" height="24" rx="5" fill="url(#tg)"/><path d="M6 7h12v3.5h-4.25V17h-3.5V10.5H6V7z" fill="#fff"/></svg>
              티맵
            </a>
          </div>
        </div>

        {/* 대중교통 */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-navy">대중교통 이용시</h3>
          <div className="mt-3 space-y-2 text-base text-neutral-700">
            <div className="flex gap-3">
              <span className="shrink-0 rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                지하철
              </span>
              <span>신분당선 청계산입구역 1번 출구 (도보 15분)</span>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                간선
              </span>
              <span>440 · 452 · 470 · 741</span>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                광역
              </span>
              <span>9404 · 9408 · 9409</span>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                직행
              </span>
              <span>3002 · 3007 · 9200 · 9400 · 9800</span>
            </div>
          </div>
        </div>

        {/* 주차안내 */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-navy">주차안내</h3>
          <div className="mt-1.5 space-y-4">
            {/* 주차장 1: 내곡SH플라자 */}
            <div className="rounded-2xl bg-neutral-50 px-5 pb-5 pt-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-lg bg-navy px-2 py-1 text-xs font-bold text-white">1</span>
                <div className="flex-1">
                  <p className="text-base text-neutral-800">
                    <span className="font-bold">내곡SH플라자</span>
                    <span className="ml-2 border-l border-neutral-300 pl-2 text-neutral-500">서울 서초구 내곡동 391, 지하주차장 · 이마트에브리데이 건물 (도보 5분)</span>
                  </p>
                </div>
              </div>
              <dl className="mt-3 space-y-1 pl-9 text-base leading-relaxed text-neutral-600">
                <div className="flex gap-1">
                  <dt className="shrink-0 font-bold">주차권 구입</dt>
                  <dd>: 교회 사무실, 2시간권 1장 / 1,000원</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="shrink-0 font-bold">무료시간</dt>
                  <dd>: 30분</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="shrink-0 font-bold">한 번에 투입 가능 수량</dt>
                  <dd>: 3장</dd>
                </div>
                <div className="mt-2 ml-[calc(theme(spacing.9)-0.25rem)] space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ["1장", "2시간 30분"],
                      ["2장", "4시간 30분"],
                      ["3장", "6시간 30분"],
                    ].map(([tickets, time]) => (
                      <span key={tickets} className="inline-flex items-center gap-1 rounded-full bg-accent-light px-3 py-0.5 text-sm font-medium text-neutral-700">
                        <span className="font-bold text-navy">{tickets}</span> → {time}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-neutral-400">※ 6시간 30분 이상 주차시 회차 필요</p>
                </div>
                <div className="flex gap-1">
                  <dt className="shrink-0 font-bold">운영시간</dt>
                  <dd>: 24시간</dd>
                </div>
              </dl>
              <ParkingMap src="https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/site/about/parking.jpg" alt="내곡SH플라자 주차장 약도" />
              <div className="mt-3 ml-9 flex gap-2">
                <a href="https://map.kakao.com/link/search/서울 서초구 내곡동 391" target="_blank" rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
                  <svg viewBox="0 0 24 24" className="h-4 w-4"><circle cx="12" cy="12" r="12" fill="#FEE500"/><path d="M12 6.5c-3.31 0-6 2.015-6 4.5 0 1.594 1.06 2.993 2.656 3.785l-.67 2.465c-.05.186.163.334.32.222l2.94-1.96c.244.025.494.038.754.038 3.31 0 6-2.015 6-4.5S15.31 6.5 12 6.5z" fill="#3C1E1E"/></svg>
                  카카오맵
                </a>
                <a href="https://map.naver.com/p/search/내곡SH플라자" target="_blank" rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
                  <svg viewBox="0 0 24 24" className="h-4 w-4"><rect width="24" height="24" rx="4" fill="#03C75A"/><path d="M8 7.5h2.4l3.6 4.5V7.5H16v9h-2.4L10 12v4.5H8v-9z" fill="#fff"/></svg>
                  네이버맵
                </a>
                <a href="tmap://route?rGoalName=%EB%82%B4%EA%B3%A1SH%ED%94%8C%EB%9D%BC%EC%9E%90&rGoalX=127.0583&rGoalY=37.4553" target="_blank" rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
                  <svg viewBox="0 0 24 24" className="h-4 w-4"><defs><linearGradient id="tg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FF3B7A"/><stop offset="50%" stopColor="#7B61FF"/><stop offset="100%" stopColor="#00C6FF"/></linearGradient></defs><rect width="24" height="24" rx="5" fill="url(#tg1)"/><path d="M6 7h12v3.5h-4.25V17h-3.5V10.5H6V7z" fill="#fff"/></svg>
                  티맵
                </a>
              </div>
            </div>

            {/* 주차장 2: 강남농협 영농자재센터 */}
            <div className="rounded-2xl bg-neutral-50 px-5 pb-5 pt-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-lg bg-navy px-2 py-1 text-xs font-bold text-white">2</span>
                <div className="flex-1">
                  <p className="text-base text-neutral-800">
                    <span className="font-bold">강남농협 영농자재센터</span>
                    <span className="ml-2 border-l border-neutral-300 pl-2 text-neutral-500">서울 서초구 내곡동 335 (도보 3분)</span>
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1 pl-9 text-base leading-relaxed text-neutral-600">
                <li>안쪽부터 주차 (무료)</li>
                <li>교회에 오래 머무시는 분 우선 주차 바람</li>
              </ul>
              <ParkingMap src="https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/site/about/parking-nonghyup.png" alt="강남농협 영농자재센터 약도" />
              <div className="mt-3 ml-9 flex gap-2">
                <a href="https://map.kakao.com/link/search/서울 서초구 내곡동 335" target="_blank" rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
                  <svg viewBox="0 0 24 24" className="h-4 w-4"><circle cx="12" cy="12" r="12" fill="#FEE500"/><path d="M12 6.5c-3.31 0-6 2.015-6 4.5 0 1.594 1.06 2.993 2.656 3.785l-.67 2.465c-.05.186.163.334.32.222l2.94-1.96c.244.025.494.038.754.038 3.31 0 6-2.015 6-4.5S15.31 6.5 12 6.5z" fill="#3C1E1E"/></svg>
                  카카오맵
                </a>
                <a href="https://map.naver.com/p/search/강남농협 영농자재센터 내곡" target="_blank" rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
                  <svg viewBox="0 0 24 24" className="h-4 w-4"><rect width="24" height="24" rx="4" fill="#03C75A"/><path d="M8 7.5h2.4l3.6 4.5V7.5H16v9h-2.4L10 12v4.5H8v-9z" fill="#fff"/></svg>
                  네이버맵
                </a>
                <a href="tmap://route?rGoalName=%EA%B0%95%EB%82%A8%EB%86%8D%ED%98%91%20%EC%98%81%EB%86%8D%EC%9E%90%EC%9E%AC%EC%84%BC%ED%84%B0&rGoalX=127.0590&rGoalY=37.4570" target="_blank" rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white py-2.5 text-xs font-medium text-navy transition hover:border-navy/30">
                  <svg viewBox="0 0 24 24" className="h-4 w-4"><defs><linearGradient id="tg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FF3B7A"/><stop offset="50%" stopColor="#7B61FF"/><stop offset="100%" stopColor="#00C6FF"/></linearGradient></defs><rect width="24" height="24" rx="5" fill="url(#tg2)"/><path d="M6 7h12v3.5h-4.25V17h-3.5V10.5H6V7z" fill="#fff"/></svg>
                  티맵
                </a>
              </div>
            </div>

            {/* 주차장 3: 교회 내 기계식 주차장 */}
            <div className="rounded-2xl bg-neutral-50 px-5 pb-5 pt-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-lg bg-navy px-2 py-1 text-xs font-bold text-white">3</span>
                <div className="flex-1">
                  <p className="text-base font-bold text-neutral-800">교회 내 기계식 주차장</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
