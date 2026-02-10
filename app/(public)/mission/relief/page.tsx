import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "구제 사역 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="구제 사역" description="다애교회의 구제 사역을 안내합니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        다애교회는 어려운 이웃을 돌보고 나누는 삶을 실천합니다. 구제 사역을 통해 그리스도의 사랑을 전합니다.
      </p>

      <h2 className="mt-10 text-xl font-bold">구제 사역 영역</h2>
      <div className="mt-4 space-y-3">
        {[
          { title: "긴급 구호", desc: "재난, 재해 발생 시 긴급 구호 활동에 참여합니다. 국내외 재해 지역에 구호 물자를 지원합니다." },
          { title: "독거 어르신 돌봄", desc: "지역 내 독거 어르신을 정기적으로 방문하고, 식사 나눔과 말벗 봉사를 합니다." },
          { title: "저소득 가정 지원", desc: "생활이 어려운 가정에 생필품, 장학금, 의료비 등을 지원합니다." },
          { title: "김장 나눔", desc: "매년 11월, 김장 나눔 행사를 통해 지역 내 어려운 이웃에게 김치를 전달합니다." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
        구제 헌금은 전액 어려운 이웃을 위해 사용됩니다. 구제 사역에 동참하고 싶으신 분은 교회 사무실로 문의해 주세요.
      </div>
    </PublicPage>
  );
}
