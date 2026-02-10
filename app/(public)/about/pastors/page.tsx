import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "담당목사 — 다애교회" };

const pastors = [
  {
    name: "담임목사",
    role: "담임목사",
    desc: "예배와 말씀 사역, 교회 전체를 돌봅니다.",
    ministries: ["주일 예배 설교", "새가족 교육", "제자 훈련", "심방 사역"],
  },
  {
    name: "부목사",
    role: "부목사",
    desc: "청년부와 교육 사역을 담당합니다.",
    ministries: ["청년부 예배", "수요 예배", "성경공부", "상담 사역"],
  },
];

export default function Page() {
  return (
    <PublicPage title="담당목사" description="다애교회의 목사님을 소개합니다.">
      <div className="space-y-6">
        {pastors.map((pastor) => (
          <div key={pastor.name} className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl dark:bg-blue-900">
                👤
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{pastor.name}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{pastor.role}</p>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{pastor.desc}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">담당 사역</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {pastor.ministries.map((m) => (
                  <span key={m} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
