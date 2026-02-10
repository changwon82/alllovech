import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "양육 프로그램 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="양육 프로그램" description="다애교회의 양육 체계를 안내합니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        다애교회는 체계적인 양육 과정을 통해 성도들이 신앙의 기초를 세우고 성숙한 그리스도인으로 성장할 수 있도록 돕습니다.
      </p>

      <h2 className="mt-10 text-xl font-bold">양육 단계</h2>
      <div className="mt-4 space-y-4">
        {[
          { step: "1단계", title: "새가족 교육 (4주)", desc: "교회 소개, 구원의 확신, 신앙생활 기초, 교회 생활 안내", color: "bg-blue-600" },
          { step: "2단계", title: "기초 양육 (8주)", desc: "기도, 말씀, 예배, 교제, 전도의 기초를 다집니다.", color: "bg-green-600" },
          { step: "3단계", title: "성경공부 (12주)", desc: "구약·신약 개론을 통해 성경 전체의 흐름을 이해합니다.", color: "bg-purple-600" },
          { step: "4단계", title: "제자 훈련 (24주)", desc: "깊이 있는 말씀 공부와 삶의 적용을 통해 제자의 삶을 훈련합니다.", color: "bg-orange-600" },
        ].map((item) => (
          <div key={item.step} className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${item.color}`}>
              {item.step.replace("단계", "")}
            </span>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
        양육 과정은 수시 등록이 가능합니다. 교회 사무실이나 담당 교역자에게 문의해 주세요.
      </div>
    </PublicPage>
  );
}
