import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "청년부 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="청년부" description="다애교회 청년부를 소개합니다.">
      <div className="rounded-2xl bg-indigo-50 p-6 dark:bg-indigo-950/30">
        <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">청년부</p>
        <p className="mt-1 text-indigo-700 dark:text-indigo-300">20~30대 청년들의 예배와 교제 공동체</p>
      </div>

      <h2 className="mt-10 text-xl font-bold">예배 안내</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { label: "예배 시간", value: "매주 주일 오후 2:00" },
          { label: "장소", value: "본관 2층 소예배실" },
          { label: "대상", value: "20세 ~ 30대 미혼 청년" },
          { label: "담당", value: "부목사" },
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
          "주일 청년 예배 및 말씀 나눔",
          "금요 셀 모임 (소그룹 교제)",
          "월 1회 전체 모임 및 친교 활동",
          "여름/겨울 수련회",
          "봉사 활동 및 선교 참여",
        ].map((item, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">{item}</span>
          </li>
        ))}
      </ul>
    </PublicPage>
  );
}
