import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "제자 훈련 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="제자 훈련" description="다애교회의 제자 훈련 과정입니다.">
      <div className="rounded-2xl bg-amber-50 p-6 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-200">
          &ldquo;너희는 가서 모든 민족을 제자로 삼아&rdquo;
        </p>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">— 마태복음 28:19</p>
      </div>

      <h2 className="mt-10 text-xl font-bold">제자 훈련 안내</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { label: "기간", value: "24주 (6개월)" },
          { label: "시간", value: "매주 토요일 오전 10:00" },
          { label: "장소", value: "본관 2층 교육실" },
          { label: "대상", value: "기초 양육 수료자" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium text-neutral-400">{item.label}</p>
            <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{item.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">훈련 내용</h2>
      <div className="mt-4 space-y-3">
        {[
          { week: "1~4주", topic: "제자의 정체성", content: "그리스도인의 정체성과 사명" },
          { week: "5~8주", topic: "말씀과 기도", content: "큐티(QT) 훈련, 기도의 실천" },
          { week: "9~12주", topic: "교제와 섬김", content: "공동체 안에서의 관계와 섬김" },
          { week: "13~16주", topic: "전도와 선교", content: "복음 전하기의 실제, 선교 비전" },
          { week: "17~20주", topic: "은사와 봉사", content: "영적 은사 발견, 봉사의 실천" },
          { week: "21~24주", topic: "리더십", content: "소그룹 인도법, 양육자 훈련" },
        ].map((item) => (
          <div key={item.week} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {item.week}
              </span>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.topic}</p>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{item.content}</p>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
