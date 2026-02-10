import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "특별 집회 — 다애교회" };

const events = [
  {
    title: "부활절 특별 예배",
    date: "2025년 4월 20일 (일)",
    desc: "부활의 기쁨을 함께 나누는 특별 예배입니다. 세례식이 함께 진행됩니다.",
    status: "예정",
  },
  {
    title: "어버이주일 감사 예배",
    date: "2025년 5월 11일 (일)",
    desc: "부모님과 어른들께 감사를 드리는 특별 예배입니다.",
    status: "예정",
  },
  {
    title: "여름 수련회",
    date: "2025년 8월 (2박 3일)",
    desc: "전교인이 함께하는 여름 영성 수련회입니다.",
    status: "예정",
  },
  {
    title: "추수감사절 예배",
    date: "2025년 11월 셋째 주일",
    desc: "한 해의 감사를 드리는 특별 예배와 바자회가 함께 진행됩니다.",
    status: "예정",
  },
  {
    title: "성탄 축하 예배",
    date: "2025년 12월 25일 (목)",
    desc: "예수님의 탄생을 기념하는 성탄 축하 예배와 축하 공연이 있습니다.",
    status: "예정",
  },
];

export default function Page() {
  return (
    <PublicPage title="특별 집회" description="특별 집회 일정을 안내합니다.">
      <h2 className="text-lg font-bold">2025년 특별 행사 일정</h2>
      <div className="mt-4 space-y-4">
        {events.map((ev) => (
          <div key={ev.title} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{ev.title}</p>
                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">{ev.date}</p>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{ev.desc}</p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {ev.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
        일정은 변경될 수 있습니다. 자세한 사항은 주보 또는 교회 사무실로 문의해 주세요.
      </div>
    </PublicPage>
  );
}
