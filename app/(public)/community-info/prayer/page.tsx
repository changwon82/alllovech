import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "기도 모임 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="기도 모임" description="다애교회 기도 모임을 안내합니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        다애교회는 기도를 교회의 가장 중요한 사역으로 여기며, 다양한 기도 모임을 통해 하나님과의 교제를 이어갑니다.
      </p>

      <h2 className="mt-10 text-xl font-bold">정기 기도 모임</h2>
      <div className="mt-4 space-y-3">
        {[
          { name: "새벽 기도회", time: "매일 오전 6:00 (주일 제외)", place: "본관 2층 소예배실" },
          { name: "금요 기도회", time: "매주 금요일 오후 9:00", place: "본관 2층 소예배실" },
          { name: "중보 기도 모임", time: "매주 화요일 오전 10:00", place: "본관 기도실" },
          { name: "어머니 기도회", time: "매월 첫째 토요일 오전 10:00", place: "본관 기도실" },
        ].map((item) => (
          <div key={item.name} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.name}</p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{item.time} · {item.place}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">기도 제목</h2>
      <div className="mt-4 rounded-xl bg-neutral-50 p-5 dark:bg-neutral-800/50">
        <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          {[
            "교회의 부흥과 성장을 위해",
            "담임목사님과 교역자들의 사역을 위해",
            "성도들의 신앙 성장과 가정의 평안을 위해",
            "선교사님들의 안전과 사역의 결실을 위해",
            "나라와 민족의 평화를 위해",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </PublicPage>
  );
}
