import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "청소년부 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="청소년부" description="다애교회 청소년부를 소개합니다.">
      <div className="rounded-2xl bg-teal-50 p-6 dark:bg-teal-950/30">
        <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">청소년부</p>
        <p className="mt-1 text-teal-700 dark:text-teal-300">중·고등학생을 위한 예배와 교육 공동체</p>
      </div>

      <h2 className="mt-10 text-xl font-bold">예배 안내</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { label: "예배 시간", value: "매주 주일 오전 11:00" },
          { label: "장소", value: "별관 1층 청소년실" },
          { label: "대상", value: "중학교 1학년 ~ 고등학교 3학년" },
          { label: "담당", value: "청소년부 전도사" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium text-neutral-400">{item.label}</p>
            <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{item.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">주요 활동</h2>
      <ul className="mt-4 space-y-2">
        {[
          "주일 청소년 예배 및 공과 공부",
          "토요 모임 (레크리에이션 및 교제)",
          "여름/겨울 수련회",
          "찬양팀 활동",
          "봉사 활동 및 미션 트립",
        ].map((item, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">{item}</span>
          </li>
        ))}
      </ul>
    </PublicPage>
  );
}
