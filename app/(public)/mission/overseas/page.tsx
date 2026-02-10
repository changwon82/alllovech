import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "해외 선교 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="해외 선교" description="다애교회의 해외 선교 활동입니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        다애교회는 세계 선교에 동참하며, 현지 교회와 선교사를 지원하고 단기 선교팀을 파송합니다.
      </p>

      <h2 className="mt-10 text-xl font-bold">파송 선교사</h2>
      <div className="mt-4 space-y-3">
        {[
          { region: "동남아시아", field: "교회 개척 및 신학 교육", since: "2022년~" },
          { region: "중앙아시아", field: "의료 선교 및 교육 사역", since: "2023년~" },
          { region: "아프리카", field: "교육 및 구제 사역", since: "2024년~" },
        ].map((m) => (
          <div key={m.region} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{m.region}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{m.field}</p>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">{m.since}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">단기 선교</h2>
      <div className="mt-4 rounded-xl bg-neutral-50 p-5 dark:bg-neutral-800/50">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          매년 여름, 해외 단기 선교팀을 파송합니다. 현지 교회 사역 지원, 어린이 프로그램, 의료 봉사 등의 활동을 합니다.
          참여를 원하시는 분은 선교부 또는 교회 사무실로 문의해 주세요.
        </p>
      </div>
    </PublicPage>
  );
}
