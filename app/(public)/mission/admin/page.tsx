import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "행정부서 안내 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="행정부서 안내" description="다애교회의 행정부서를 안내합니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        다애교회의 행정부서는 교회의 원활한 운영을 위해 다양한 역할을 담당하고 있습니다.
      </p>

      <h2 className="mt-10 text-xl font-bold">행정 조직</h2>
      <div className="mt-4 space-y-4">
        {[
          {
            dept: "당회",
            head: "담임목사",
            desc: "교회의 최고 의결 기관으로, 교회 운영에 관한 주요 사항을 결정합니다.",
            members: "담임목사, 시무장로",
          },
          {
            dept: "제직회",
            head: "담임목사",
            desc: "교회의 전체 직분자 회의로, 교회 사역 방향을 공유하고 협력합니다.",
            members: "전체 직분자",
          },
          {
            dept: "재정부",
            head: "재정담당 장로",
            desc: "교회 재정의 투명한 관리와 예결산을 담당합니다.",
            members: "장로, 회계, 서기",
          },
          {
            dept: "교육부",
            head: "교육담당 권사",
            desc: "주일학교, 성경공부, 양육 프로그램을 기획하고 운영합니다.",
            members: "교역자, 교사",
          },
          {
            dept: "선교부",
            head: "선교담당 장로",
            desc: "국내외 선교 사역을 기획하고 선교사 후원을 관리합니다.",
            members: "선교위원",
          },
          {
            dept: "봉사부",
            head: "봉사담당 권사",
            desc: "교회 내 봉사팀 운영과 지역사회 봉사 활동을 총괄합니다.",
            members: "각 봉사팀 팀장",
          },
        ].map((item) => (
          <div key={item.dept} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{item.dept}</p>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {item.head}
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
            <p className="mt-2 text-xs text-neutral-400">구성: {item.members}</p>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
