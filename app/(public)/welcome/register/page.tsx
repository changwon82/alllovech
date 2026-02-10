import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "새가족 등록 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="새가족 등록" description="다애교회의 새 가족이 되어 주세요.">
      {/* 안내 메시지 */}
      <div className="rounded-2xl bg-amber-50 p-6 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-200">
          다애교회에 오신 것을 진심으로 환영합니다!
        </p>
        <p className="mt-2 text-amber-800 dark:text-amber-300">
          처음 방문하신 분도 편안하게 예배에 참여하실 수 있습니다. 아래 절차에 따라 새가족으로 등록해 주세요.
        </p>
      </div>

      {/* 등록 절차 */}
      <h2 className="mt-10 text-xl font-bold">새가족 등록 절차</h2>
      <ol className="mt-4 space-y-4">
        {[
          { step: "1", title: "주일 예배 참석", desc: "매주 일요일 오전 11:00 예배에 참석해 주세요. 안내 위원이 좌석과 순서지를 안내해 드립니다." },
          { step: "2", title: "새가족 카드 작성", desc: "예배 후 로비에서 새가족 카드를 작성해 주세요. 이름, 연락처, 주소 등 간단한 정보만 기재합니다." },
          { step: "3", title: "새가족 심방", desc: "담당 교역자 또는 새가족 위원이 일주일 내에 연락을 드려 환영 심방을 진행합니다." },
          { step: "4", title: "새가족 교육 (4주)", desc: "4주간의 새가족 교육을 통해 교회의 비전과 신앙생활의 기초를 배웁니다." },
          { step: "5", title: "등록 완료", desc: "새가족 교육 수료 후 정식 교인으로 등록되며, 소그룹(셀)에 배정됩니다." },
        ].map((item) => (
          <li key={item.step} className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {item.step}
            </span>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* 준비물 */}
      <h2 className="mt-10 text-xl font-bold">첫 방문 시 안내</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          { title: "복장", desc: "편안한 복장으로 오시면 됩니다." },
          { title: "주차", desc: "교회 건물 내 주차장을 이용하실 수 있습니다." },
          { title: "자녀 동반", desc: "유아~초등학생 자녀는 주일학교에서 함께 예배합니다." },
          { title: "문의", desc: "궁금한 점은 교회 사무실로 연락해 주세요." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
