import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "국내 선교 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="국내 선교" description="다애교회의 국내 선교 활동입니다.">
      <p className="text-neutral-600 dark:text-neutral-400">
        다애교회는 국내 소외 지역의 교회와 기관을 지원하며, 복음 전파와 사회 봉사에 힘쓰고 있습니다.
      </p>

      <h2 className="mt-10 text-xl font-bold">국내 선교 사역</h2>
      <div className="mt-4 space-y-3">
        {[
          { title: "농어촌 교회 지원", desc: "소규모 농어촌 교회에 물질적·영적 지원을 합니다. 연 2회 방문 사역을 진행합니다." },
          { title: "군부대 전도", desc: "인근 군부대 장병들을 위한 전도 활동과 간식 나눔을 진행합니다." },
          { title: "다문화 가정 사역", desc: "다문화 가정을 위한 한국어 교육, 문화 적응 지원, 자녀 돌봄을 합니다." },
          { title: "노숙인 사역", desc: "노숙인을 위한 식사 제공과 복음 전도, 사회 복귀를 돕습니다." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
