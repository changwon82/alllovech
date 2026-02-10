import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "주일 설교 — 다애교회" };

const sermons = [
  { date: "2025.02.09", title: "사랑의 공동체", scripture: "고린도전서 13:1-13", speaker: "담임목사" },
  { date: "2025.02.02", title: "믿음의 반석 위에", scripture: "마태복음 7:24-27", speaker: "담임목사" },
  { date: "2025.01.26", title: "새해, 새 마음으로", scripture: "이사야 43:18-19", speaker: "담임목사" },
  { date: "2025.01.19", title: "기도의 능력", scripture: "빌립보서 4:6-7", speaker: "담임목사" },
  { date: "2025.01.12", title: "빛의 자녀로 살아가기", scripture: "에베소서 5:8-14", speaker: "담임목사" },
  { date: "2025.01.05", title: "2025년을 여는 믿음", scripture: "히브리서 11:1-6", speaker: "담임목사" },
];

export default function Page() {
  return (
    <PublicPage title="주일 설교" description="주일 설교를 다시 들으실 수 있습니다.">
      <div className="space-y-3">
        {sermons.map((s) => (
          <div key={s.date} className="rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/50">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{s.title}</p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {s.scripture} · {s.speaker}
                </p>
              </div>
              <p className="text-sm text-neutral-400 dark:text-neutral-500">{s.date}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-neutral-50 p-4 text-center text-sm text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
        더 많은 설교는 교회 유튜브 채널에서 확인하실 수 있습니다.
      </div>
    </PublicPage>
  );
}
