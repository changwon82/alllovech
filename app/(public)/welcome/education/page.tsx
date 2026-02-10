import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "새가족 교육 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="새가족 교육" description="새가족을 위한 교육 안내입니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        다애교회의 새가족 교육은 총 4주 과정으로 진행됩니다. 교육을 통해 교회의 비전을 이해하고, 신앙생활의 기초를 세울 수 있습니다.
      </p>

      {/* 교육 일정 */}
      <h2 className="mt-10 text-xl font-bold">교육 일정</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 font-semibold">주차</th>
              <th className="px-4 py-3 font-semibold">주제</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">내용</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {[
              { week: "1주", topic: "다애교회에 오신 것을 환영합니다", content: "교회 소개, 담임목사 인사, 교회 비전 나눔" },
              { week: "2주", topic: "구원의 확신", content: "복음의 핵심, 구원의 의미, 신앙고백" },
              { week: "3주", topic: "신앙생활의 기초", content: "예배, 기도, 말씀, 교제의 중요성" },
              { week: "4주", topic: "교회 생활 안내", content: "소그룹 배정, 봉사 안내, 수료식" },
            ].map((row) => (
              <tr key={row.week} className="bg-white dark:bg-neutral-900">
                <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">{row.week}</td>
                <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{row.topic}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">{row.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 안내사항 */}
      <h2 className="mt-10 text-xl font-bold">안내사항</h2>
      <ul className="mt-4 space-y-3">
        {[
          "교육 시간: 매주 주일 오후 1:00 ~ 2:30",
          "교육 장소: 본관 2층 교육실",
          "수료 후 소그룹(셀)에 배정되어 교제를 시작합니다.",
          "교육 기간 중 결석 시 보충 수업이 가능합니다.",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
            <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
          </li>
        ))}
      </ul>
    </PublicPage>
  );
}
