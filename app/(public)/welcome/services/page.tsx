import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "예배 안내 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="예배 안내" description="다애교회의 예배 시간을 안내합니다.">
      <ul className="space-y-3 text-neutral-600 dark:text-neutral-400">
        <li className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <strong>주일 예배</strong> — 매주 일요일 오전 11:00
        </li>
        <li className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <strong>수요 예배</strong> — 매주 수요일 오후 7:30
        </li>
        <li className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <strong>금요 기도회</strong> — 매주 금요일 오후 9:00
        </li>
      </ul>
    </PublicPage>
  );
}
