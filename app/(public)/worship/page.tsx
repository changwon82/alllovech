import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "주일 예배 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="주일 예배" description="매주 일요일 오전 11:00">
      {/* 예배 정보 */}
      <div className="rounded-2xl bg-blue-50 p-6 dark:bg-blue-950/30">
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">주일 예배</p>
          <p className="text-lg text-blue-700 dark:text-blue-300">매주 일요일 오전 11:00</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">장소: 본관 3층 대예배실</p>
        </div>
      </div>

      {/* 예배 순서 */}
      <h2 className="mt-10 text-xl font-bold">예배 순서</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {[
              { order: "경배와 찬양", detail: "찬양팀 인도" },
              { order: "기도", detail: "대표기도" },
              { order: "성경 봉독", detail: "" },
              { order: "설교 말씀", detail: "담임목사" },
              { order: "찬송", detail: "" },
              { order: "헌금", detail: "" },
              { order: "광고 및 축도", detail: "" },
            ].map((row) => (
              <tr key={row.order} className="bg-white dark:bg-neutral-900">
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{row.order}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 안내 */}
      <h2 className="mt-10 text-xl font-bold">안내</h2>
      <ul className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          예배 10분 전까지 입장해 주시면 감사하겠습니다.
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          유아~초등학생 자녀는 1층에서 주일학교 예배에 참석합니다.
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          예배 후 1층 친교실에서 점심 교제가 있습니다.
        </li>
      </ul>
    </PublicPage>
  );
}
