import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "교회 연혁 — 다애교회" };

const history = [
  { year: "2020", events: ["3월 — 다애교회 개척 예배 (성도 15명)", "5월 — 첫 새가족 교육 수료", "9월 — 소그룹(셀) 사역 시작"] },
  { year: "2021", events: ["1월 — 주일학교 개설 (유초등부)", "4월 — 수요 예배 시작", "8월 — 청년부 창설", "11월 — 첫 번째 선교 헌금"] },
  { year: "2022", events: ["2월 — 새벽 기도회 시작", "6월 — 성도 50명 돌파", "9월 — 금요 기도회 시작", "12월 — 첫 성탄 축하 예배"] },
  { year: "2023", events: ["3월 — 청소년부 창설", "5월 — 제자 훈련 1기 수료", "8월 — 국내 단기 선교 파송", "10월 — 영유아부 개설"] },
  { year: "2024", events: ["1월 — 교회 홈페이지 개설", "4월 — 성도 100명 돌파", "7월 — 해외 선교 파트너십 체결", "11월 — 봉사팀 조직 확대"] },
  { year: "2025", events: ["현재 — 사랑으로 하나 되어, 세상을 품는 교회"] },
];

export default function Page() {
  return (
    <PublicPage title="교회 연혁" description="다애교회의 발자취입니다.">
      <div className="relative space-y-0">
        {history.map((item, i) => (
          <div key={item.year} className="relative flex gap-6 pb-8 last:pb-0">
            {/* 타임라인 */}
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {item.year.slice(2)}
              </div>
              {i < history.length - 1 && (
                <div className="w-0.5 grow bg-neutral-200 dark:bg-neutral-700" />
              )}
            </div>
            {/* 내용 */}
            <div className="pt-1.5">
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{item.year}년</p>
              <ul className="mt-2 space-y-1.5">
                {item.events.map((ev, j) => (
                  <li key={j} className="text-sm text-neutral-600 dark:text-neutral-400">{ev}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
