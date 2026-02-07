import PublicPage from "@/src/components/PublicPage";
export const metadata = { title: "오시는 길 — 다애교회" };
export default function Page() {
  return (
    <PublicPage title="오시는 길" description="다애교회 오시는 길을 안내합니다.">
      <div className="space-y-4 text-neutral-600 dark:text-neutral-400">
        <p>주소 정보를 입력해 주세요.</p>
      </div>
    </PublicPage>
  );
}
