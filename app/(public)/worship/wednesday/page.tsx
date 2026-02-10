import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "수요 예배 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="수요 예배" description="매주 수요일 오후 7:30">
      <div className="rounded-2xl bg-green-50 p-6 dark:bg-green-950/30">
        <p className="text-2xl font-bold text-green-900 dark:text-green-100">수요 예배</p>
        <p className="mt-1 text-lg text-green-700 dark:text-green-300">매주 수요일 오후 7:30</p>
        <p className="text-sm text-green-600 dark:text-green-400">장소: 본관 2층 소예배실</p>
      </div>

      <h2 className="mt-10 text-xl font-bold">수요 예배 안내</h2>
      <div className="mt-4 space-y-4 text-neutral-600 dark:text-neutral-400">
        <p>
          수요 예배는 한 주의 중간에 하나님 앞에 나아가 말씀을 듣고 기도하는 시간입니다.
          성경의 각 권을 순서대로 강해하며, 삶에 적용할 수 있는 말씀을 나눕니다.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-bold">예배 순서</h2>
      <ul className="mt-4 space-y-2">
        {["찬양 (15분)", "기도", "말씀 (30분)", "나눔 및 기도 제목 공유", "축도"].map((item, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
              {i + 1}
            </span>
            <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
          </li>
        ))}
      </ul>
    </PublicPage>
  );
}
