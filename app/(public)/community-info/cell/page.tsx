import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "셀 모임 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="셀 모임" description="다애교회 셀 모임을 소개합니다.">
      <div className="rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-950/30">
        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">셀 모임</p>
        <p className="mt-1 text-emerald-700 dark:text-emerald-300">작은 공동체 안에서 나누는 깊은 교제</p>
      </div>

      <h2 className="mt-10 text-xl font-bold">셀 모임이란?</h2>
      <p className="mt-4 text-neutral-600 dark:text-neutral-400">
        셀(Cell)은 5~12명으로 구성된 소그룹으로, 가정이나 교회에서 모여 말씀을 나누고 서로를 돌보는 모임입니다.
        교회의 가장 기본적인 교제 단위로, 신앙의 성장과 삶의 나눔이 이루어지는 공간입니다.
      </p>

      <h2 className="mt-10 text-xl font-bold">모임 안내</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { label: "모임 시간", value: "주중 저녁 (셀별 상이)" },
          { label: "모임 장소", value: "가정 또는 교회" },
          { label: "모임 주기", value: "매주 1회" },
          { label: "인원", value: "5~12명" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium text-neutral-400">{item.label}</p>
            <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{item.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">모임 순서</h2>
      <ul className="mt-4 space-y-2">
        {["환영 및 아이스브레이킹", "찬양 (1~2곡)", "말씀 나눔 (주일 설교 기반)", "기도 제목 나눔 및 합심 기도", "교제 및 다과"].map((item, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              {i + 1}
            </span>
            <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
          </li>
        ))}
      </ul>
    </PublicPage>
  );
}
