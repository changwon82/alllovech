import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "금요 기도회 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="금요 기도회" description="매주 금요일 오후 9:00">
      <div className="rounded-2xl bg-purple-50 p-6 dark:bg-purple-950/30">
        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">금요 기도회</p>
        <p className="mt-1 text-lg text-purple-700 dark:text-purple-300">매주 금요일 오후 9:00</p>
        <p className="text-sm text-purple-600 dark:text-purple-400">장소: 본관 2층 소예배실</p>
      </div>

      <h2 className="mt-10 text-xl font-bold">금요 기도회 안내</h2>
      <div className="mt-4 space-y-4 text-neutral-600 dark:text-neutral-400">
        <p>
          금요 기도회는 한 주를 마무리하며 하나님께 감사와 간구를 올려드리는 시간입니다.
          찬양과 기도, 짧은 말씀을 통해 영적으로 충전하는 귀한 시간입니다.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-bold">기도회 순서</h2>
      <ul className="mt-4 space-y-2">
        {["찬양과 경배", "짧은 말씀 묵상", "개인 기도 / 통성 기도", "중보 기도 (교회, 나라, 선교)", "마무리 기도 및 축도"].map((item, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              {i + 1}
            </span>
            <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
          </li>
        ))}
      </ul>
    </PublicPage>
  );
}
