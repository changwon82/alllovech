import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "새벽 기도회 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="새벽 기도회" description="매일 새벽에 드리는 기도회입니다.">
      <div className="rounded-2xl bg-orange-50 p-6 dark:bg-orange-950/30">
        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">새벽 기도회</p>
        <p className="mt-1 text-lg text-orange-700 dark:text-orange-300">매일 오전 6:00 (주일 제외)</p>
        <p className="text-sm text-orange-600 dark:text-orange-400">장소: 본관 2층 소예배실</p>
      </div>

      <h2 className="mt-10 text-xl font-bold">새벽 기도회 안내</h2>
      <div className="mt-4 space-y-4 text-neutral-600 dark:text-neutral-400">
        <p>
          새벽 기도회는 하루를 시작하기 전 하나님 앞에 나아가 말씀과 기도로 하루를 여는 시간입니다.
          짧은 말씀 묵상과 합심 기도로 진행됩니다.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-bold">진행 순서</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { time: "06:00", content: "찬송 및 기도" },
          { time: "06:10", content: "말씀 묵상 (10분)" },
          { time: "06:20", content: "합심 기도" },
          { time: "06:30", content: "마무리" },
        ].map((item) => (
          <div key={item.time} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="rounded-lg bg-orange-100 px-2 py-1 text-sm font-bold text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              {item.time}
            </span>
            <span className="text-neutral-700 dark:text-neutral-300">{item.content}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
        토요일은 새벽 기도회 대신 특별 기도 시간으로 운영될 수 있습니다. 자세한 사항은 주보를 확인해 주세요.
      </div>
    </PublicPage>
  );
}
